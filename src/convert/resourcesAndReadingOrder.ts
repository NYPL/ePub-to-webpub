import { Manifest } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-manifest';
import Epub from '../Epub';
import { ReadiumLink } from '../WebpubManifestTypes/ReadiumLink';

/**
 * The readingOrder lists the resources of the publication in the reading order
 * they should be read in. The resources object is for any _other_ resources needed,
 * but not found in the readingOrder, such as css files. We first get all the resources,
 * then remove the ones that are in the reading order (the opf's Spine). Spec:
 *
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.
 */
export async function resourcesAndReadingOrder(
  epub: Epub
): Promise<ReadingOrderAndResources> {
  // get out every resources from the manifest
  const allResources = await extractResources(epub);
  // keep a record of what IDs appear in the reading order so we can filter them
  // from the resources later
  const appearsInReadingOrder: Record<string, boolean> = {};
  const readingOrder = epub.opf.Spine.Items.reduce<ReadiumLink[]>(
    (acc, item) => {
      const link = allResources.find((link) => link.id === item.IDref);
      if (link) {
        acc.push(link);
        appearsInReadingOrder[link.id] = true;
      }
      return acc;
    },
    []
  );
  // filter allResources to only have ones not found in reading order
  const resources = allResources.filter(
    (link) => !appearsInReadingOrder[link.id]
  );

  return {
    resources,
    readingOrder,
  };
}

type LinkWithId = ReadiumLink & { id: string };

type ReadingOrderAndResources = {
  readingOrder: ReadiumLink[];
  resources?: ReadiumLink[];
};

/**
 * This is a very basic implementation that extracts resources from the OPF
 * manifest. The links href, type, and ID, and other info detected
 * from the properties string.
 *
 * The Readium implementation will look for a <meta name="cover"> tag
 * to add a rel:"cover" property to the link, but we have decided not
 * to do that since it's not in the EPUB 2 or EPUB 3 spec.
 * We can add it in the future if necessary.
 */
async function extractResources(epub: Epub): Promise<LinkWithId[]> {
  const resources: LinkWithId[] = await Promise.all(
    epub.opf.Manifest.map(manifestToLink(epub))
  );

  return resources;
}

/**
 * Process an OPF Manifest item (called a Manifest) into
 * a Readium link for the resources or reading order.
 *
 * EPUB 3 OPF files can have 'properties' on the <meta> tags and on th
 * manifest items. These need to be processed into values we define on the
 * ReadiumLink, like rel: "cover" for example.
 *
 * EPUB 2 files do not have properties.
 *
 * This will also extract encryption info from the encryption.xml file to include
 * in the resulting ReadiumLink
 *
 * This function is curried so we can pass it an epub once and then use it in a map
 * function.
 *
 */
const manifestToLink =
  (epub: Epub) =>
  async (manifest: Manifest): Promise<LinkWithId> => {
    const decodedHref = manifest.HrefDecoded;
    if (!decodedHref) {
      throw new Error(`OPF Link missing HrefDecoded`);
    }
    const href = epub.fetcher.resolveHref(
      epub.opfPath,
      decodedHref,
      epub.useRelativeHrefs
    );
    const relativePath = epub.fetcher.resolveRelativePath(
      epub.opfPath,
      decodedHref
    );
    const link: LinkWithId = {
      href,
      type: manifest.MediaType,
      id: manifest.ID,
    };

    // add encryption information if present
    const enc = epub.getLinkEncryption(relativePath);
    if (enc) {
      link.properties = { encrypted: enc };
    }

    const linkWithProperties = await addEpub3Properties(
      epub,
      manifest,
      decodedHref,
      link
    );

    return linkWithProperties;
  };

/**
 * EPUB 3
 * Add the properties to the link. This is barely implemented
 * and there is much more to add if we want. It is found in:
 * Readium Code: https://github.com/readium/r2-shared-js/blob/79378116dd296ad3c8dd474818a0cd37fc84dd53/src/parser/epub.ts#L441
 * EPUB 3 Spec: http://idpf.org/epub/30/spec/epub30-publications.html#sec-item-property-values
 * @TODO :
 *  - add media overlay
 */
async function addEpub3Properties(
  epub: Epub,
  manifest: Manifest,
  href: string,
  link: LinkWithId
): Promise<LinkWithId> {
  // get properties from both the manifest itself and the spine
  const manifestProperties = Epub.parseSpaceSeparatedString(
    manifest.Properties
  );
  const spineProperties = Epub.parseSpaceSeparatedString(
    epub.opf.Spine?.Items?.find((item) => item.IDref === manifest.ID)
      ?.Properties
  );
  const allProperties = [...manifestProperties, ...spineProperties];

  for (const p of allProperties) {
    switch (p) {
      case 'cover-image':
        link.rel = 'cover';
        // we should get the height and width for cover iamges
        if (link.type?.includes('image/')) {
          const fullPath = epub.fetcher.resolvePath(epub.opfPath, href);
          const dimensions = await epub.fetcher.getImageDimensions(fullPath);
          if (dimensions?.width && dimensions.height) {
            link.width = dimensions.width;
            link.height = dimensions.height;
          }
        }
        break;
      case 'nav':
        link.rel = 'contents';
        break;
      default:
        break;
    }
  }
  return link;
}

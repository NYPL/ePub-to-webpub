import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { DCMetadata } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-dc-metadata';
import { Metafield } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-metafield';
import { ReadiumWebpubContext } from './constants';
import { Contributors } from './types/Metadata';
import { ReadiumLink } from './types/ReadiumLink';
import { WebpubManifest } from './types/WebpubManifest';
import xpath from 'xpath';
import { DOMParser } from 'xmldom';
import sizeOf from 'image-size';
import { Manifest } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-manifest';
import { safelyGet } from './utils';
import { getImageBuffer } from './get-files';
import Epub from './Epub';

/**
 * References:
 * - EPUB 2 Spec: http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm
 * - EPUB 3 Spec: http://idpf.org/epub/30/spec/epub30-publications.html
 *
 * @TODO :
 * - Support EPUB 3 Spine-based TOC
 * - support NavMap, Page List and NavList from EPUB 2 Spec:
 *    http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1
 * - support more metadata
 * - Link data needs to be added to the resources?
 * - Add cover info. Search for the cover Meta, then find that manifes
 *    by the id of the cover, then add the info from the manifest to the
 *    link in resources.
 * - Add media overlay?
 * - adobe page map to page list
 */

/**
 * Main entrypoint to constructing a manifest from an opf and NCX
 */
export async function constructManifest(
  epub: Epub
): Promise<WebpubManifest> {
  const metadata = extractMetadata(epub);
  const links = extractLinks(epub);
  const resourcesObj = await resourcesAndReadingOrder(epub);
  const toc = extractToc(epub);

  return {
    '@context': ReadiumWebpubContext,
    metadata,
    links,
    ...resourcesObj,
    toc,
  };
}

/**
 * Extracts a named metadata property from either epub.opf.Metatada.DCMetadata
 * or epub.opf.Metadata, if the prior doesn't exist. Returns undefined
 * in case of failure. This is to support EPUB 2.0, which allows
 * metadata to be nested within dc:metadata:
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.2
 */
function extractMetadataMember<T extends keyof DCMetadata>(epub: Epub, key: T) {
  return epub.opf.Metadata?.DCMetadata?.[key] ?? epub.opf.Metadata[key];
}

/**
 * Extracts meta fields that are found in the XMetadata or Meta arrays
 * within the Metadata object. This is necessary because EPUB allows metadata
 * to be nested under either tag.
 */
function extractMetaField(epub: Epub, filter: (meta: Metafield) => boolean) {
  /**
   * These properties are not marked as optional, but that is a mistake, they
   * are indeed optional and need to use optional chaining and nullish coalescing
   */
  const xMetaFields = epub.opf.Metadata?.XMetadata?.Meta?.filter(filter) ?? [];
  const metaFields = epub.opf.Metadata?.Meta?.filter(filter) ?? [];

  return [...xMetaFields, ...metaFields];
}

/**
 * The main function to get the metadata out of the OPF file.
 *
 * For the purposes of this project, the metadata is not _super_ important since
 * these are not being distributed as webpubs, we just need enough info for our
 * reader to display the book correctly.
 *
 * Missing from metadata:
 * - Language Map support for language-based fields
 * - Subtitle extraction
 * - Publication Direction
 * - ...less important stuff defined in the Metadata type
 */
function extractMetadata(epub: Epub): WebpubManifest['metadata'] {
  const language = extractMetadataMember(epub, 'Language');
  const title = extractTitle(epub);
  const contributors = extractContributors(epub);

  return {
    title,
    language: language.length > 1 ? language : language[0],
    ...contributors,
  };
}

/**
 * Instead of extracting a map of titles based on language, we will just use
 * the first title we find. This can be extended later to add a
 * map of languages and titles.
 */
function extractTitle(epub: Epub) {
  const titleMeta = extractMetadataMember(epub, 'Title');
  return titleMeta?.[0].Data ?? 'Uknown Title';
}

/**
 * We will extract a simple list of string contributor names
 * for each contributor role.
 */
function extractContributors(epub: Epub): Contributors {
  const contributorFields = extractMetaField(
    epub,
    (meta: Metafield) =>
      meta.Property === 'dcterms:creator' ||
      meta.Property === 'dcterms:contributor'
  );

  // Map from EPUB role codes to Webpub Roles
  const roleMap: Record<string, string> = {
    aut: 'author',
    trl: 'translator',
    art: 'artist',
    edt: 'editor',
    ill: 'illustrator',
    ltr: 'letterer',
    pen: 'penciler',
    clr: 'colorist',
    ink: 'inker',
    nrt: 'narrator',
    pbl: 'publisher',
  };

  const contributors = contributorFields.reduce<Contributors>(
    (all, contributor) => {
      const name = contributor.Data;
      // get the role, which is a sibling xml node. The default is contributor
      const epubRole =
        extractMetaField(
          epub,
          field => field.Property === 'role' && field.ID === contributor.ID
        )?.[0]?.Data ?? 'contributor';
      const webpubRole = roleMap[epubRole] ?? 'contributor';
      return {
        ...all,
        [webpubRole]: name,
      };
    },
    {}
  );

  // the author get pre-extracted for some reason from the metafields
  const creators = extractMetadataMember(epub, 'Creator');
  if (creators.length > 0) {
    if (creators.length > 1) {
      contributors.author = creators.map(creator => creator.Data);
    } else {
      contributors.author = creators[0].Data;
    }
  }

  return contributors;
}

function extractLinks(epub: Epub) {
  return [];
}

type LinkWithId = ReadiumLink & { id: string };

type ReadingOrderAndResources = {
  readingOrder: ReadiumLink[];
  resources?: ReadiumLink[];
};

/**
 * The readingOrder lists the resources of the publication in the reading order
 * they should be read in. The resources object is for any _other_ resources needed,
 * but not found in the readingOrder, such as css files. We first get all the resources,
 * then remove the ones that are in the reading order (the opf's Spine). Spec:
 *
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.
 */
async function resourcesAndReadingOrder(epub: Epub): Promise<ReadingOrderAndResources> {
  // get out every resources from the manifest
  const allResources = await extractResources(epub);
  // keep a record of what IDs appear in the reading order so we can filter them
  // from the resources later
  const appearsInReadingOrder: Record<string, boolean> = {};
  const readingOrder = epub.opf.Spine.Items.reduce<ReadiumLink[]>((acc, item) => {
    const link = allResources.find(link => link.id === item.IDref);
    if (link) {
      if (!item.Linear || item.Linear === 'yes') {
        acc.push(link);
        appearsInReadingOrder[link.id] = true;
      }
    }
    return acc;
  }, []);
  // filter allResources to only have ones not found in reading order
  const resources = allResources.filter(
    link => !appearsInReadingOrder[link.id]
  );

  return {
    resources,
    readingOrder,
  };
}

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
  const resources: LinkWithId[] = await Promise.all(epub.opf.Manifest.map(
    manifestToLink(epub)
  ));

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
 * This function is curried so we can pass it an opf once and then use it in a map
 * function.
 *
 */
const manifestToLink = (epub: Epub) => async (
  manifest: Manifest
): Promise<LinkWithId> => {
  const decodedHref = manifest.HrefDecoded;
  if (!decodedHref) {
    throw new Error(`OPF Link missing HrefDecoded`);
  }
  const link: LinkWithId = {
    // I'm not sure if this should be hard-coded or what...
    href: `OEBPS/${decodedHref}`,
    type: manifest.MediaType,
    id: manifest.ID,
  };

  // if it is an image, we should get the height and width
  if (link.type?.includes('image/')) {
    const dimensions = await getImageDimensions(epub, link);
    if (dimensions?.width && dimensions.height) {
      link.width = dimensions.width;
      link.height = dimensions.height;
    }
  }

  const linkWithProperties = withEpub3Properties(epub, manifest, link);

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
function withEpub3Properties(
  epub: Epub,
  manifest: Manifest,
  link: LinkWithId
): LinkWithId {
  // get properties from both the manifest itself and the spine
  const manifestProperties = propertiesArrayFromString(manifest.Properties);
  const spineProperties = propertiesArrayFromString(
    epub.opf.Spine?.Items?.find(item => item.IDref === manifest.ID)?.Properties
  );
  const allProperties = [...manifestProperties, ...spineProperties];

  for (const p of allProperties) {
    switch (p) {
      case 'cover-image':
        link.rel = 'cover';
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

/**
 * Parses a space separated string of properties into an array
 */
function propertiesArrayFromString(str: string | undefined | null): string[] {
  return (
    str
      ?.trim()
      .split(' ')
      .map(role => role.trim())
      .filter(role => role.length > 0) ?? []
  );
}

/**
 * Gets the image buffer and figures out the dimensions
 */
async function getImageDimensions(epub: Epub, link: ReadiumLink) {
  const imageBuffer = await epub.getBuffer(link.href);
  const dimensions = safelyGet(sizeOf(imageBuffer).images ?? [], 0);
  return dimensions;
}

/**
 * Only EPUB 2 uses the toc.ncx file. EPUB 3 uses
 * the spine insted. In EPUB 2, the spine defines the reading order
 * only, while in EPUB 3 it defines reading order and TOC.
 * @TODO : add EPUB 3 TOC extraction
 */
function extractToc(
  epub: Epub
): WebpubManifest['toc'] {
  // detect version
  if (!epub.ncx) {
    throw new Error('EPUB 3 TOC extraction not yet implemented');
  }
  return extractTocFromNcx(epub.ncx);
}

const select = xpath.useNamespaces({
  epub: 'http://www.idpf.org/2007/ops',
  xhtml: 'http://www.w3.org/1999/xhtml',
});

/**
 * NCX files are used by EPUB 2 books to define the
 * TOC. The spec is here:
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1
 */
export function extractTocFromNcx(ncx: Document): ReadiumLink[] {
  // const navMap = ncx.getElementsByTagName('navMap')[0];

  const points = select('/navMap/navPoint', ncx);

  const toc = points.map(point => {
    return navPointToLink(point.toString());
  });

  return toc;
}

function selectAttr(query: string, node: Node): string | undefined {
  const selectedVal = select(query, node, true);
  if (typeof selectedVal === 'object' && 'value' in selectedVal) {
    return selectedVal.value;
  }
  return undefined;
}
function selectText(query: string, node: Node): string | undefined {
  const val = select(query, node, true);
  if (typeof val === 'object' && 'nodeValue' in val) {
    return val.nodeValue ?? undefined;
  }
  return undefined;
}

/**
 * Extracts a ReadiumLink from an NCX XML string. We have to pass the string
 * and re-form the Document on every recursion otherwise this doesn't work.
 */
export function navPointToLink(xml: string): ReadiumLink {
  // construct a Document from the xml string
  const point = new DOMParser().parseFromString(xml);

  // check if this is indeed a Node
  if (
    typeof point === 'string' ||
    typeof point === 'boolean' ||
    typeof point === 'string' ||
    typeof point === 'number'
  ) {
    throw new Error('SelectedValue is not a valid Node.');
  }
  const title = selectText('navPoint/navLabel/text/text()', point);
  const href = selectAttr('/navPoint/content/@src', point);
  const childrenNodes = select('navPoint/navPoint', point).filter(
    child => !!child
  );
  if (!href) {
    throw new Error(
      `Malformed navPoint. Point with title: "${title}" is missing href`
    );
  }
  const link: ReadiumLink = {
    title,
    href,
  };
  if (childrenNodes.length > 0) {
    const children = childrenNodes
      .map(child => navPointToLink(child.toString()))
      .filter(isLink);
    link.children = children;
  }
  return link;
}

function isLink(val: ReadiumLink | undefined): val is ReadiumLink {
  return !!val;
}

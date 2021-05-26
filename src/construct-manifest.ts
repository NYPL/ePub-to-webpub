import { Metafield } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-metafield';
import { ReadiumWebpubContext } from './constants';
import { Contributors } from './WebpubManifest/Metadata';
import { ReadiumLink } from './WebpubManifest/ReadiumLink';
import { WebpubManifest } from './WebpubManifest/WebpubManifest';
import sizeOf from 'image-size';
import { Manifest } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-manifest';
import Epub from './Epub';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import { NavPoint } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx-navpoint';
import xpath from 'xpath';
import { DOMParser } from 'xmldom';

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
 * - page list support in general
 */

/**
 * Main entrypoint to constructing a manifest from an opf and NCX
 */
export async function constructManifest(epub: Epub): Promise<WebpubManifest> {
  const metadata = extractMetadata(epub);
  const resourcesObj = await resourcesAndReadingOrder(epub);
  const toc = extractToc(epub);

  return {
    '@context': ReadiumWebpubContext,
    metadata,
    ...resourcesObj,
    toc,
    // we have not implemented any links
    links: [],
  };
}

/**
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
  const language = epub.extractMetadataMember('Language');
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
  const titleMeta = epub.extractMetadataMember('Title');
  return titleMeta?.[0].Data ?? 'Uknown Title';
}

/**
 * We will extract a simple list of string contributor names
 * for each contributor role.
 */
function extractContributors(epub: Epub): Contributors {
  const contributorFields = epub.extractMetaField(
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
        epub.extractMetaField(
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
  const creators = epub.extractMetadataMember('Creator');
  if (creators.length > 0) {
    if (creators.length > 1) {
      contributors.author = creators.map(creator => creator.Data);
    } else {
      contributors.author = creators[0].Data;
    }
  }

  return contributors;
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
async function resourcesAndReadingOrder(
  epub: Epub
): Promise<ReadingOrderAndResources> {
  // get out every resources from the manifest
  const allResources = await extractResources(epub);
  // keep a record of what IDs appear in the reading order so we can filter them
  // from the resources later
  const appearsInReadingOrder: Record<string, boolean> = {};
  const readingOrder = epub.opf.Spine.Items.reduce<ReadiumLink[]>(
    (acc, item) => {
      const link = allResources.find(link => link.id === item.IDref);
      if (link) {
        if (!item.Linear || item.Linear === 'yes') {
          acc.push(link);
          appearsInReadingOrder[link.id] = true;
        }
      }
      return acc;
    },
    []
  );
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
 * This function is curried so we can pass it an epub once and then use it in a map
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
    href: epub.getRelativeHref(decodedHref),
    type: manifest.MediaType,
    id: manifest.ID,
  };

  // if it is an image, we should get the height and width
  if (link.type?.includes('image/')) {
    const dimensions = await getImageDimensions(epub, decodedHref);
    if (dimensions?.width && dimensions.height) {
      console.log(dimensions);
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
  const manifestProperties = Epub.parseSpaceSeparatedString(
    manifest.Properties
  );
  const spineProperties = Epub.parseSpaceSeparatedString(
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
 * Gets the image buffer and figures out the dimensions
 */
async function getImageDimensions(epub: Epub, relativeHref: string) {
  const pth = epub.getAbsoluteHref(relativeHref);
  const dimensions = sizeOf(pth);
  return dimensions;
}

/**
 * Only EPUB 2 uses the toc.ncx file. EPUB 3 uses
 * the spine insted. In EPUB 2, the spine defines the reading order
 * only, while in EPUB 3 it defines reading order and TOC.
 * @TODO : add EPUB 3 TOC extraction
 */
function extractToc(epub: Epub): WebpubManifest['toc'] {
  // detect versionjj
  if (epub.version === '3') {
    return extractTocFromNavDoc(epub);
  }
  if (!epub.ncx) {
    throw new Error('EPUB 2 missing NCX file');
  }
  return extractTocFromNcx(epub, epub.ncx);
}

// used for extracting things from the NavDoc
const select = xpath.useNamespaces({
  epub: 'http://www.idpf.org/2007/ops',
  xhtml: 'http://www.w3.org/1999/xhtml',
});

/**
 * EPUB 3s embed the TOC information in a Nav Document,
 * whereas EPUB 2s put that info in the NCX file. This function
 * extracts TOC information for the manifest from the Nav Document
 */
function extractTocFromNavDoc(epub: Epub): ReadiumLink[] {
  const { navDoc } = epub;
  /**
   * - Get the "navs"
   * - For each oe
   *    - get the olElem
   *    - get the roles array
   *    - if it is a toc role, parse the toc
   * @TODO : Parse non-TOC roles like PageList, etc
   */
  const navs = select(
    '/xhtml:html/xhtml:body//xhtml:nav',
    epub.navDoc
  ) as Element[];

  // we only care about the toc nav currently. In the future we can
  // parse the other navs, like PageList
  const tocNav = navs.find(nav => {
    // the nav with epub:type="toc" is our toc
    const epubType = (select('@epub:type', nav, true) as Attr).value;
    const types = Epub.parseSpaceSeparatedString(epubType);
    return types.includes('toc');
  });

  const listItems = select('//ol/li', tocNav) as Element[];
  const toc = listItems.map(listItemToLink(epub.getRelativeHref));
  return toc;
}

export const listItemToLink = (
  getRelativeHref: (relative: string) => string
) => (listItem: Element): ReadiumLink => {
  const doc = new DOMParser().parseFromString(listItem.toString(), 'utf-8');
  const spanTitle = select('string(/li/span)', doc, true);
  const anchorTitle = select('string(/li/a)', doc, true);
  const href = select('string(/li/a/@href)', doc);

  const childElements = select('/li/ol/li', doc) as Element[] | undefined;
  const children = childElements?.map(listItemToLink(getRelativeHref));

  /**
   * If the element has a span child instead of an anchor child, then
   * it won't have an href so we use the href of the first child as the
   * href of this section.
   */
  if (typeof spanTitle === 'string' && spanTitle.length > 0) {
    // this is unsafe, but if it fails then the toc is malformed.
    // it must have a child if it has a span instead of anchor
    if (!children?.[0]) {
      throw new Error('TOC List Item with <span> is missing children.');
    }
    const firstChildHref = children?.[0].href;
    const link: ReadiumLink = {
      href: firstChildHref,
      title: spanTitle,
    };
    // add children if there are any
    if (children && children.length > 0) link.children = children;
    return link;
  }
  // otherwise we are dealing with a standard element with a link
  if (typeof anchorTitle !== 'string') {
    throw new Error('TOC List item missing title (child of anchor element).');
  }
  if (typeof href !== 'string') {
    throw new Error('TOC List item missing href');
  }

  const link: ReadiumLink = {
    title: anchorTitle,
    href: getRelativeHref(href),
  };
  // add children if there are any
  if (children && children.length > 0) link.children = children;
  return link;
};

/**
 * NCX files are used by EPUB 2 books to define the
 * TOC. The spec is here:
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1
 */
export function extractTocFromNcx(epub: Epub, ncx: NCX): ReadiumLink[] {
  const points = ncx.Points;

  const toc = points.map(navPointToLink(epub));

  return toc;
}

/**
 * Turns a NavPoint from an NCX file into a ReadiumLink.
 */
export const navPointToLink = (epub: Epub) => (
  point: NavPoint
): ReadiumLink => {
  const href = point.Content.SrcDecoded;
  if (!href) {
    throw new Error(`NavPoint missing href: ${point}`);
  }
  const link: ReadiumLink = {
    title: point.NavLabel.Text,
    href: epub.getRelativeHref(href),
  };

  // we cast this to make the type wider because it's wrong in r2-shared-js.
  // it actually can be undefined.
  const childPoints = point.Points as NavPoint[] | undefined;
  // recurse on the children points
  if (childPoints && childPoints.length > 0) {
    const children = childPoints.map(navPointToLink(epub)).filter(isLink);
    link.children = children;
  }
  return link;
};

// useful for typescript to use in a filter
function isLink(val: ReadiumLink | undefined): val is ReadiumLink {
  return !!val;
}

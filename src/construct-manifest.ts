import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { DCMetadata } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-dc-metadata';
import { Metafield } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-metafield';
import { ReadiumWebpubContext, READIUM_CONTEXT } from './constants';
import { Contributors } from './types/Metadata';
import { ReadiumLink } from './types/ReadiumLink';
import { WebpubManifest } from './types/WebpubManifest';
import xpath from 'xpath';
import { DOMParser } from 'xmldom';

/**
 * References:
 * - EPUB 2 Spec: http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4
 * - EPUB 3 Spec:
 *
 * TO DO:
 * - Support EPUB 3 Spine-based TOC
 * - support NavMap, Page List and NavList from EPUB 2 Spec:
 *    http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1
 * - support more metadata
 */

/**
 * Main entrypoint to constructing a manifest from an opf and NCX
 */
export async function constructManifest(
  opf: OPF,
  ncx?: Document
): Promise<WebpubManifest> {
  /**
   * @TODO
   * spine
   * resources
   * toc (using toc.ncx)
   * adobe page map to page list
   */
  const metadata = extractMetadata(opf);
  const links = extractLinks(opf);
  const resourcesObj = resourcesAndReadingOrder(opf);
  const toc = extractToc(opf, ncx);

  return {
    '@context': ReadiumWebpubContext,
    metadata,
    links,
    ...resourcesObj,
    toc,
  };
}

/**
 * Extracts a named metadata property from either opf.Metatada.DCMetadata
 * or opf.Metadata, if the prior doesn't exist. Returns undefined
 * in case of failure. This is to support EPUB 2.0, which allows
 * metadata to be nested within dc:metadata:
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.2
 */
function extractMetadataMember<T extends keyof DCMetadata>(opf: OPF, key: T) {
  return opf.Metadata?.DCMetadata?.[key] ?? opf.Metadata[key];
}

/**
 * Extracts meta fields that are found in the XMetadata or Meta arrays
 * within the Metadata object. This is necessary because EPUB allows metadata
 * to be nested under either tag.
 */
function extractMetaField(opf: OPF, filter: (meta: Metafield) => boolean) {
  /**
   * These properties are not marked as optional, but that is a mistake, they
   * are indeed optional and need to use optional chaining and nullish coalescing
   */
  const xMetaFields = opf.Metadata?.XMetadata?.Meta?.filter(filter) ?? [];
  const metaFields = opf.Metadata?.Meta?.filter(filter) ?? [];

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
function extractMetadata(opf: OPF): WebpubManifest['metadata'] {
  const language = extractMetadataMember(opf, 'Language');
  const title = extractTitle(opf);
  const contributors = extractContributors(opf);

  return {
    title,
    language,
    ...contributors,
  };
}

/**
 * Instead of extracting a map of titles based on language, we will just use
 * the first title we find. This can be extended later to add a
 * map of languages and titles.
 */
function extractTitle(opf: OPF) {
  const titleMeta = extractMetadataMember(opf, 'Title');
  return titleMeta?.[0].Data ?? 'Uknown Title';
}

/**
 * We will extract a simple list of string contributor names
 * for each contributor role.
 */
function extractContributors(opf: OPF): Contributors {
  const contributorFields = extractMetaField(
    opf,
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
          opf,
          field => field.Property === 'role' && field.ID === contributor.ID
        )?.[0].Data ?? 'contributor';
      const webpubRole = roleMap[epubRole] ?? 'contributor';
      return {
        ...all,
        [webpubRole]: name,
      };
    },
    {}
  );

  return contributors;
}

function extractLinks(opf: OPF) {
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
 * but not found in the readingOrder, such as css files.
 */
function resourcesAndReadingOrder(opf: OPF): ReadingOrderAndResources {
  // get out every resources from the manifest
  const allResources = extractResources(opf);
  // keep a record of what IDs appear in the reading order so we can filter them
  // from the resources later
  const appearsInReadingOrder: Record<string, boolean> = {};
  const readingOrder = opf.Spine.Items.reduce<ReadiumLink[]>((acc, item) => {
    const link = allResources.find(link => link.id);
    if (link) {
      if (!item.Linear || item.Linear === 'yes') {
        acc.push(link);
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
 * This seems it comes from the Spine:
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.
 *
 * We only add the items with `linear: 'yes'`, as any other items
 * are not part of reading order, just a resource.
 *
 */
function extractReadingOrder(opf: OPF, resources: LinkWithId[]): ReadiumLink[] {
  const readingOrder = opf.Spine.Items.reduce<ReadiumLink[]>((acc, item) => {
    if (!item.Linear || item.Linear === 'yes') {
      const link = resources.find(link => link.id);
      if (link) acc.push(link);
    }
    return acc;
  }, []);
  return readingOrder;
}

/**
 * This is a very basic implementation that extracts resources from the OPF
 * manifest. The links are only given href, type and ID for now.
 */
function extractResources(opf: OPF): LinkWithId[] {
  const resources: LinkWithId[] = opf.Manifest.map(item => {
    const decodedHref = item.HrefDecoded;
    if (!decodedHref) {
      throw new Error(`OPF Link missing HrefDecoded`);
    }
    const mimeType = item.MediaType;
    return {
      href: decodedHref,
      type: mimeType,
      id: item.ID,
    };
  });

  return resources;
}

/**
 * Only EPUB 2 uses the toc.ncx file. EPUB 3 uses
 * the spine insted.
 *
 * QUESTION: What is the role of <spine> when there exists
 * a toc.ncx file? It appears the spine (in EPUB 2 at least) is for
 * reading order.
 */
function extractToc(
  opf: OPF,
  tocDoc: Document | undefined
): WebpubManifest['toc'] {
  // detect version
  return tocDoc ? extractTocFromNcx(tocDoc) : undefined;
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

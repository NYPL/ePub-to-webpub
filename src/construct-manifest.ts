import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { DCMetadata } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-dc-metadata';
import { Metafield } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-metafield';
import { READIUM_CONTEXT } from './constants';
import { Contributors } from './types/Metadata';
import { ReadiumLink } from './types/ReadiumLink';
import { WebpubManifest } from './types/WebpubManifest';

/**
 * References:
 * - EPUB 2 Spec: http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4
 * - EPUB 3 Spec:
 *
 * TO DO:
 * - support NavMap, Page List and NavList from EPUB 2 Spec:
 *    http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1
 * - support more metadata
 */

/**
 * Main entrypoint to constructing a manifest from an opf and NCX
 */
export async function constructManifest(
  opf: OPF,
  toc?: Document
): Promise<WebpubManifest> {
  /**
   * @TODO
   * spine
   * resources
   * toc (using toc.ncx)
   * adobe page map to page list
   */
  return {
    '@context': READIUM_CONTEXT,
    metadata: extractMetadata(opf),
    links: extractLinks(opf),
    readingOrder: extractReadingOrder(opf),
    resources: extractResources(opf),
    toc: extractToc(opf, toc),
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
  const xMetaFields = opf.Metadata.XMetadata.Meta.filter(filter);
  const metaFields = opf.Metadata.Meta.filter(filter);

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
      // get the role, which is a sibling xml node
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

function extractLinks(opf: OPF) {}

/**
 * This seems it comes from the Spine:
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4
 *
 */
function extractReadingOrder(opf: OPF) {}

/**
 * This is a very basic implementation that extracts resources from the OPF
 * manifest. The links are only given href and type for now.
 */
function extractResources(opf: OPF): WebpubManifest['resources'] {
  const resources: ReadiumLink[] = opf.Manifest.map(item => {
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

/**
 * NCX files are used by EPUB 2 books to define the
 * TOC. The spec is here:
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1
 */
export function extractTocFromNcx(ncx: Document): ReadiumLink[] {
  const navMap = ncx.getElementsByTagName('navMap')[0];

  /**
   * Reduce over the children of navMap, which are navPoints
   */
  // const toc = reduceDomTree<ReadiumLink[]>(
  //   (prev, current) => {

  //   },
  //   navMap.firstChild,
  //   []
  // );

  return toc;
}

function reduceNavPoint(acc: ReadiumLink[], point: Node): ReadiumLink {
  const children = Array.from(point.childNodes);
  const title = children.find(child => child.nodeName === 'navLabel')
    ?.firstChild?.nodeValue;
  const href = children.find(child => child.nodeName === 'content')?.firstChild
    ?.textContent;

  return {
    href: '',
    title: '',
    children,
  };
}

function reduceDomTree<T>(
  reducer: (prev: T, current: ChildNode) => T,
  node: ChildNode,
  init: T
): T {
  // calculate the value with this node
  const acc = reducer(init, node);
  // if there are no children, return that
  if (!node.hasChildNodes) return acc;
  // if there are children, we need to reduce each one
  return Array.from(node.childNodes).reduce<T>((prev, childNode) => {
    return reduceDomTree(reducer, childNode, prev);
  }, acc);
}
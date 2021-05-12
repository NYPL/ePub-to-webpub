import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { DCMetadata } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-dc-metadata';
import { READIUM_CONTEXT } from './constants';
import { WebpubManifest } from './types/WebpubManifest';

export async function constructManifest(opf: OPF): Promise<WebpubManifest> {
  /**
   * @TODO
   * language
   * title
   * identifier
   * otherMetadata
   * publicationDirection
   * contributorMeta
   * spine
   * resources
   * rendition
   * cover rel
   * encryption
   * toc (using toc.ncx)
   * adobe page map to page list
   * calibre serie info
   * subject
   * publication date
   */
  return {
    '@context': READIUM_CONTEXT,
    metadata: extractMetadata(opf),
    links: extractLinks(opf),
    readingOrder: extractReadingOrder(opf),
    resources: extractResources(opf),
    toc: extractToc(opf),
  };
}

/**
 * Extracts an item from either opf.Metatada.DCMetadata
 * or opf.Metadata, if the prior doesn't exist. Returns undefined
 * in case of failure
 */
function extractMetadataMember<T extends keyof DCMetadata>(opf: OPF, key: T) {
  return opf.Metadata?.DCMetadata?.[key]?.length
    ? opf.Metadata.DCMetadata[key]
    : opf.Metadata?.[key]?.length
    ? opf.Metadata[key]
    : undefined;
}

/**
 * For the purposes of this project, the metadata is not _super_ important since
 * these are not being distributed as webpubs, we just need enough info for our
 * reader to display the book correctly.
 */
function extractMetadata(opf: OPF) {
  const language = extractMetadataMember(opf, 'Language');
  const title = extractMetadataMember(opf, 'Title');
}

/**
 * Uses readium recommendations to extract a title. See:
 * https://github.com/readium/architecture/blob/master/streamer/parser/metadata.md#title
 */
function extractTitle(opf: OPF) {}

function extractLinks(opf: OPF) {}

function extractReadingOrder(opf: OPF) {}

function extractResources(opf: OPF) {}

function extractToc(opf: OPF) {}

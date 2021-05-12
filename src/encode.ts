import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { READIUM_CONTEXT } from './constants';
import { WebpubManifest } from './types/WebpubManifest';

export async function encodeManifest(opf: OPF): Promise<WebpubManifest> {
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

function extractMetadata(opf: OPF) {}

function extractLinks(opf: OPF) {}

function extractReadingOrder(opf: OPF) {}

function extractResources(opf: OPF) {}

function extractToc(opf: OPF) {}

import { ReadiumWebpubContext } from '../constants';
import { WebpubManifest } from '../WebpubManifestTypes/WebpubManifest';
import Epub from '../Epub';
import { extractTocFromNavDoc } from './navdoc';
import { extractTocFromNcx } from './ncx';
import { extractMetadata } from './metadata';
import { resourcesAndReadingOrder } from './resourcesAndReadingOrder';

/**
 * References:
 * - EPUB 2 Spec: http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm
 * - EPUB 3 Spec: http://idpf.org/epub/30/spec/epub30-publications.html
 *
 * @TODO (presently):
 * - Add media overlay?
 *
 * @TODO (in the future maybe):
 * - support NavMap, Page List and NavList from EPUB NCX and EPUB 3 Nav Doc
 *    http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1
 * - support more metadata
 * - Add links, like a self link to start with
 * - Add cover info. Search for the cover Meta, then find that manifes
 *    by the id of the cover, then add the info from the manifest to the
 *    link in resources.
 */

/**
 * Main entrypoint to constructing a manifest from an opf and NCX
 */
export async function epubToManifest(epub: Epub): Promise<WebpubManifest> {
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
 * Only EPUB 2 uses the toc.ncx file. EPUB 3 uses
 * the spine insted. In EPUB 2, the spine defines the reading order
 * only, while in EPUB 3 it defines reading order and TOC.
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

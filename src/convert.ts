import { Metadata } from './types/Metadata';
import { ReadiumLink } from './types/ReadiumLink';
import { WebpubManifest } from './types/WebpubManifest';
import { parseStringPromise } from 'xml2js';
/**
 * This is a decoding problem. We take in a set of files, and parse, then decode into a Publication.
 * type Parser<Pub> = (Dir) -> Pub
 */
export default async function convertToWebpub(
  opf: string
): Promise<WebpubManifest> {
  // make sure this is the right version of EPUB

  // handle errors / failures

  const { package: opfXml } = await parseStringPromise(opf);

  const context = 'http://readium.org/webpub/default.jsonld';

  const metadata = extractMetadata(opfXml);
  const links = extractLinks(opfXml);
  const readingOrder = extractReadingOrder(opfXml);
  const resources = extractResources(opfXml);
  const toc = extractToc(opfXml);

  return {
    '@context': context,
    metadata,
    links,
    readingOrder,
    resources,
    toc,
  };
}

function extractMetadata(opf: any): Metadata {
  const title = opf?.metadata[0]?.['dc:title']?.[0];

  console.log(title);
  return {
    title: title,
    '@type': 'http://schema.org/Book',
    modified: Date.now().toString(),
  };
}
function extractLinks(_opf: unknown): any[] {
  return [];
}
function extractReadingOrder(_opf: unknown): ReadiumLink[] {
  return [];
}
function extractResources(_opf: unknown): ReadiumLink[] {
  return [];
}
function extractToc(_opf: unknown): ReadiumLink[] {
  return [];
}

import path from 'path';
import Epub from '../Epub';
import LocalFetcher from '../LocalFetcher';

async function getManifest(container: string) {
  const fetcher = new LocalFetcher(container);
  const epub = await Epub.build(container, fetcher);
  const manifest = await epub.webpubManifest;
  return manifest;
}

describe('EPUB 2', () => {
  it('extracts empty toc when NavPoints are missing', async () => {
    const container = path.resolve(
      __dirname,
      '../../samples/epub2-missing-navpoints/META-INF/container.xml'
    );
    const manifest = await getManifest(container);
    expect(manifest.toc).toEqual([]);
  });
});

describe('EPUB 3', () => {
  it('extracts empty TOC when ListItems are missing', async () => {
    const container = path.resolve(
      __dirname,
      '../../samples/epub3-missing-listitems/META-INF/container.xml'
    );
    const manifest = await getManifest(container);
    expect(manifest.toc).toEqual([]);
  });
});

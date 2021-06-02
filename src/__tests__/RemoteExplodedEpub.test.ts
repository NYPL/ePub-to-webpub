import Epub from '../Epub';
import { baseUrl } from './constants';
import mobyEpub2Manifest from './stubs/moby-epub2';
import mobyEpub3Manifest from './stubs/moby-epub3';
import { expectSelectively, expectSelectivelyArr } from './utils';

const MobyEpub2Href = `${baseUrl}/samples/moby-epub2-exploded/META-INF/container.xml`;
const MobyEpub3Href = `${baseUrl}/samples/moby-epub3-exploded/META-INF/container.xml`;

describe('Moby EPUB 2 Exploded', () => {
  async function getManifest() {
    const epub = await Epub.build(MobyEpub2Href);
    const manifest = await epub.webpubManifest;
    return manifest;
  }

  it('context', async () => {
    const manifest = await getManifest();
    expect(manifest['@context']).toBe(mobyEpub2Manifest['@context']);
  });

  it('extracts correct metadata', async () => {
    const manifest = await getManifest();

    expectSelectively(
      manifest.metadata,
      mobyEpub2Manifest.metadata,
      'author',
      'title',
      'language'
    );
  });

  it('extracts reading order', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.readingOrder,
      mobyEpub2Manifest.readingOrder,
      'href',
      'type'
    );
  });

  it('extracts resources', async () => {
    const manifest = await getManifest();

    expectSelectivelyArr(
      manifest.resources as any,
      mobyEpub2Manifest.resources,
      'href',
      'type',
      'width',
      'height',
      'type'
    );
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    expect(manifest.toc).toEqual(mobyEpub2Manifest.toc);
  });
});

describe('Moby EPUB 3 Exploded', () => {
  async function getManifest() {
    const epub = await RemoteExplodedEpub.build(MobyEpub3Href);
    const manifest = await epub.webpubManifest;
    return manifest;
  }

  it('context', async () => {
    const manifest = await getManifest();
    expect(manifest['@context']).toBe(mobyEpub3Manifest['@context']);
  });

  it('extracts correct metadata', async () => {
    const manifest = await getManifest();

    expect(manifest.metadata.author).toBe(
      mobyEpub3Manifest.metadata.author.name
    );
    expectSelectively(
      manifest.metadata,
      mobyEpub3Manifest.metadata,
      'title',
      'language'
    );
  });

  it('extracts reading order', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.readingOrder,
      mobyEpub3Manifest.readingOrder,
      'href',
      'type'
    );
  });

  it('extracts resources', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.resources as any,
      mobyEpub3Manifest.resources,
      'href',
      'type',
      'width',
      'height',
      'type'
    );
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    expect(manifest.toc).toEqual(mobyEpub3Manifest.toc);
  });
});

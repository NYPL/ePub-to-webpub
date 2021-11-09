import Epub from '../Epub';
import RemoteFetcher from '../RemoteFetcher';
import { baseUrl } from './constants';
import mobyEpub2Manifest from './stubs/moby-epub2';
import mobyEpub2SubdirNcx from './stubs/moby-epub2-subdir-ncx';
import mobyEpub3Manifest from './stubs/moby-epub3';
import mobyAbsoluteHrefs from './stubs/moby-epub3-absolute-hrefs';
import epub3Subdir from './stubs/moby-epub3-subdir-navdoc';
import { expectSelectively, expectSelectivelyArr } from './utils';

const MobyEpub2Href = `${baseUrl}/samples/moby-epub2-exploded/META-INF/container.xml`;
const MobyEpub3Href = `${baseUrl}/samples/moby-epub3-exploded/META-INF/container.xml`;

describe('Moby EPUB 2 Exploded', () => {
  async function getManifest() {
    const fetcher = new RemoteFetcher(MobyEpub2Href);
    const epub = await Epub.build(MobyEpub2Href, fetcher);
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
    const fetcher = new RemoteFetcher(MobyEpub3Href);
    const epub = await Epub.build(MobyEpub3Href, fetcher);
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
      'type',
      'rel'
    );
  });

  it('extracts resources', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.resources as any,
      mobyEpub3Manifest.resources,
      'href',
      'type',
      'rel'
    );
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    expect(manifest.toc).toEqual(mobyEpub3Manifest.toc);
  });
});

describe('Absolute Hrefs', () => {
  async function getManifest() {
    const fetcher = new RemoteFetcher(MobyEpub3Href);
    const epub = await Epub.build(MobyEpub3Href, fetcher, {
      useRelativeHrefs: false,
    });
    const manifest = await epub.webpubManifest;
    return manifest;
  }

  it('context', async () => {
    const manifest = await getManifest();
    expect(manifest['@context']).toBe(mobyAbsoluteHrefs['@context']);
  });

  it('extracts correct metadata', async () => {
    const manifest = await getManifest();

    expect(manifest.metadata.author).toBe(
      mobyAbsoluteHrefs.metadata.author.name
    );
    expectSelectively(
      manifest.metadata,
      mobyAbsoluteHrefs.metadata,
      'title',
      'language'
    );
  });

  it('extracts reading order', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.readingOrder,
      mobyAbsoluteHrefs.readingOrder,
      'href',
      'type',
      'rel'
    );
  });

  it('extracts resources', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.resources as any,
      mobyAbsoluteHrefs.resources,
      'href',
      'type',
      'rel'
    );
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    expect(manifest.toc).toEqual(mobyAbsoluteHrefs.toc);
  });
});

const Epub3SubdirNavdoc = `${baseUrl}/samples/epub-3-subdir-navdoc/META-INF/container.xml`;

describe('With NavDoc in a subdirectory', () => {
  async function getManifest() {
    const fetcher = new RemoteFetcher(Epub3SubdirNavdoc);
    const epub = await Epub.build(Epub3SubdirNavdoc, fetcher, {});
    const manifest = await epub.webpubManifest;
    return manifest;
  }

  it('extracts reading order', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.readingOrder,
      epub3Subdir.readingOrder,
      'href',
      'type'
    );
  });

  it('extracts resources', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.resources as any,
      epub3Subdir.resources,
      'href',
      'type',
      'rel'
    );
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    expect(manifest.toc).toEqual(epub3Subdir.toc);
  });
});

const Epub2SubdirNCX = `${baseUrl}/samples/epub2-subdir-navdoc/META-INF/container.xml`;

describe('With NCX in a subdirectory', () => {
  async function getManifest() {
    const fetcher = new RemoteFetcher(Epub2SubdirNCX);
    const epub = await Epub.build(Epub2SubdirNCX, fetcher, {});
    const manifest = await epub.webpubManifest;
    return manifest;
  }

  it('extracts reading order', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.readingOrder,
      mobyEpub2SubdirNcx.readingOrder,
      'href',
      'type'
    );
  });

  it('extracts resources', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.resources as any,
      mobyEpub2SubdirNcx.resources,
      'href',
      'type'
    );
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    expect(manifest.toc).toEqual(mobyEpub2SubdirNcx.toc);
  });
});

import path from 'path';
import Epub from '../Epub';
import LocalFetcher from '../LocalFetcher';
import mobyEpub2Manifest from './stubs/moby-epub2';
import mobyEpub3Manifest from './stubs/moby-epub3';
import mobyEpub3FXLManifest from './stubs/moby-epub3-fxl';
import mobyEpub2FXLManifest from './stubs/moby-epub2-fxl';
import { expectSelectively, expectSelectivelyArr } from './utils';

const epub2Container = path.resolve(
  __dirname,
  '../../samples/moby-epub2-exploded/META-INF/container.xml'
);
const epub3Container = path.resolve(
  __dirname,
  '../../samples/moby-epub3-exploded/META-INF/container.xml'
);

describe('Moby EPUB 2 Exploded', () => {
  async function getManifest() {
    const fetcher = new LocalFetcher(epub2Container);
    const epub = await Epub.build(epub2Container, fetcher);
    const manifest = await epub.webpubManifest;
    return manifest;
  }

  it('context', async () => {
    const manifest = await getManifest();
    expect(manifest['@context']).toBe(mobyEpub2Manifest['@context']);
  });

  it('extracts correct metadata', async () => {
    const manifest = await getManifest();

    expect(manifest.metadata.presentation?.layout).toBe(undefined);

    expectSelectively(
      manifest.metadata,
      mobyEpub2Manifest.metadata,
      'author',
      'title',
      'language',
      'identifier'
    );
  });

  it('extracts reading order', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.readingOrder,
      mobyEpub2Manifest.readingOrder,
      'href',
      'type',
      'rel'
    );
  });

  it('extracts resources', async () => {
    const manifest = await getManifest();

    expectSelectivelyArr(
      manifest.resources as any,
      mobyEpub2Manifest.resources,
      'href',
      'type',
      'rel'
    );
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    expect(manifest.toc).toEqual(mobyEpub2Manifest.toc);
  });
});

describe('Moby EPUB 3 Exploded', () => {
  async function getManifest() {
    const fetcher = new LocalFetcher(epub3Container);
    const epub = await Epub.build(epub3Container, fetcher);
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

    expect(manifest.metadata.presentation?.layout).toBe(undefined);

    expectSelectively(
      manifest.metadata,
      mobyEpub3Manifest.metadata,
      'title',
      'language',
      'identifier'
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

const epub2FXLContainer = path.resolve(
  __dirname,
  '../../samples/moby-epub2-fxl/META-INF/container.xml'
);

const epub3FXLContainer = path.resolve(
  __dirname,
  '../../samples/moby-epub3-fxl/META-INF/container.xml'
);

describe('Moby EPUB 2 FXL layout', () => {
  async function getManifest() {
    const fetcher = new LocalFetcher(epub2FXLContainer);
    const epub = await Epub.build(epub2FXLContainer, fetcher);
    const manifest = await epub.webpubManifest;
    return manifest;
  }

  it('extracts correct metadata', async () => {
    const manifest = await getManifest();

    expect(manifest.metadata.presentation?.layout).toBe(
      mobyEpub2FXLManifest.metadata.presentation.layout
    );

    expectSelectively(
      manifest.metadata,
      mobyEpub2FXLManifest.metadata,
      'author',
      'title',
      'language',
      'identifier'
    );
  });
});

describe('Moby EPUB 3 FXL layout', () => {
  async function getManifest() {
    const fetcher = new LocalFetcher(epub3FXLContainer);
    const epub = await Epub.build(epub3FXLContainer, fetcher);
    const manifest = await epub.webpubManifest;
    return manifest;
  }

  it('extracts correct metadata', async () => {
    const manifest = await getManifest();

    expect(manifest.metadata.author).toBe(
      mobyEpub3Manifest.metadata.author.name
    );

    expect(manifest.metadata.presentation?.layout).toBe(
      mobyEpub3FXLManifest.metadata.presentation.layout
    );

    expectSelectively(
      manifest.metadata,
      mobyEpub3FXLManifest.metadata,
      'title',
      'language',
      'identifier'
    );
  });
});

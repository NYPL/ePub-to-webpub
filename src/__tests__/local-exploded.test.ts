import path from 'path';
import { localExploded } from '..';
import explodedMobyManifest from './stubs/exploded-moby-manifest';

/**
 * Compares two objects only by a set of passed
 * in keys
 */
const expectSelectively = (
  compare: Record<string, any>,
  received: Record<string, any>,
  ...keys: string[]
) => {
  keys.forEach(key => {
    expect(received[key]).toBe(compare[key]);
  });
};

/**
 * compares two arrays of objects by the keys passed in
 */
const expectSelectivelyArr = (
  receivedArr: Record<string, any>[],
  compareArr: Record<string, any>[],
  ...keys: string[]
) => {
  receivedArr.forEach((received, i) => {
    const compare = compareArr[i];
    expectSelectively(compare, received, ...keys);
  });
};

describe('EPUB 2', () => {
  async function getManifest() {
    const containerXmlPath = path.resolve(
      __dirname,
      '../../samples/moby-epub-exploded/META-INF/container.xml'
    );
    return await localExploded(containerXmlPath);
  }

  it('context', async () => {
    const manifest = await getManifest();
    expect(manifest['@context']).toBe(explodedMobyManifest['@context']);
  });

  it('extracts correct metadata', async () => {
    const manifest = await getManifest();

    expectSelectively(
      manifest.metadata,
      explodedMobyManifest.metadata,
      'author',
      'title',
      'language'
    );
  });

  // we don't have this currently, and might not need it at all.
  // it('extracts links', async () => {
  //   const manifest = await getManifest();
  //   // links
  //   // we will need to add a canonical self link eventually
  //   throw new Error('Links are not implemented');
  // });

  it('extracts reading order', async () => {
    const manifest = await getManifest();
    expectSelectivelyArr(
      manifest.readingOrder,
      explodedMobyManifest.readingOrder,
      'href',
      'type'
    );
  });

  it('extracts resources', async () => {
    const manifest = await getManifest();

    expectSelectivelyArr(
      manifest.resources as any,
      explodedMobyManifest.resources,
      'href',
      'type',
      'width',
      'type'
    );
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    expect(manifest.toc).toEqual(explodedMobyManifest.toc);
  });
});

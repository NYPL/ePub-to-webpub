import path from 'path';
import { localExploded } from '..';
import explodedMobyManifest from './stubs/exploded-moby-manifest.json';

describe('EPUB 2', async () => {
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
    // metadata
    expect(explodedMobyManifest.metadata).toEqual(
      expect.objectContaining(manifest.metadata)
    );
    // make sure it has the contributors
    expect(manifest.metadata.author).toBe(explodedMobyManifest.metadata.author);
  });

  it('extracts links', async () => {
    const manifest = await getManifest();
    // links
    // we will need to add a canonical self link eventually
    throw new Error();
  });

  it('extracts reading order', async () => {
    const manifest = await getManifest();
    // reading order
    expect(manifest.readingOrder).toEqual(explodedMobyManifest.readingOrder);
  });

  it.only('extracts resources', async () => {
    const manifest = await getManifest();
    // resources
    expect(manifest.resources).toEqual(explodedMobyManifest.resources);
  });

  it('extracts toc', async () => {
    const manifest = await getManifest();
    throw new Error();
  });
});

import path from 'path';
import { localExploded } from '..';
import explodedMobyManifest from './stubs/exploded-moby-manifest.json';

describe('EPUB 2', () => {
  it('contructs Moby Dick Manifest', async () => {
    const containerXmlPath = path.resolve(
      __dirname,
      '../../samples/moby-epub-exploded/META-INF/container.xml'
    );
    const manifest = await localExploded(containerXmlPath);
    expect(manifest['@context']).toBe(explodedMobyManifest['@context']);
    // metadata
    expect(explodedMobyManifest.metadata).toEqual(
      expect.objectContaining(manifest.metadata)
    );
    // make sure it has the contributors
    expect(manifest.metadata.author).toBe(explodedMobyManifest.metadata.author);

    // links
    // we will need to add a canonical self link eventually
    expect(manifest.links).toEqual([]);

    // reading order
    expect(manifest.readingOrder).toEqual(explodedMobyManifest.readingOrder);

    // resources
    expect(manifest.resources).toEqual(explodedMobyManifest.resources);

    // toc
  });
});

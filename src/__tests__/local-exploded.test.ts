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
    expect(manifest.metadata.title).toBe(explodedMobyManifest.metadata.title);
    expect(manifest['@context']).toBe(explodedMobyManifest['@context']);
    expect(manifest).toEqual(explodedMobyManifest);
  });
});

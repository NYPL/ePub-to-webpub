import convertWithR2 from '../src/convertWithR2';
import path from 'path';
import mobyWebpubManifest from '../samples/moby-webpub/manifest.json';
import { baseUrl } from '../mocks/constants';
import { server } from '../mocks/server';

const explodedMobyEpub = path.resolve(
  __dirname,
  '../samples/moby-epub-exploded'
);

beforeAll(() => {
  // Lock Time
  jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000);
});

describe('Unencrypted, Local, Exploded ePub', () => {
  it('returns correct webpub manifest', async () => {
    const manifest = await convertWithR2(explodedMobyEpub);

    expect(manifest).toEqual(mobyWebpubManifest);
  });
});

// you must pass in a file ending in container.xml
const remoteExplodedEpub = `${baseUrl}/sample/remote-exploded-epub/META-INF/container.xml`;

// mock fetch to return files from local

describe.only('Unencrypted, Remote, Exploded ePub', () => {
  it('returns correct webpub manifest', async () => {
    console.log(server.printHandlers());

    const manifest = await convertWithR2(remoteExplodedEpub);

    expect(manifest).toEqual(mobyWebpubManifest);
  });
});

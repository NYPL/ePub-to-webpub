import { baseUrl } from './constants';
import path from 'path';
import LocalFetcher from '../LocalFetcher';
import Epub from '../Epub';

const Decryptor = require('@nypl-simplified-packages/axisnow-access-control-web');

const encryptedHref = `${baseUrl}/samples/axisnow/encrypted/META-INF/container.xml`;
const decryptedHref = `${baseUrl}/samples/axisnow/decrypted/META-INF/container.xml`;

const decryptedPath = path.resolve(
  __dirname,
  '../../samples/axisnow/decrypted/META-INF/container.xml'
);
const encryptedPath = path.resolve(
  __dirname,
  '../../samples/axisnow/encrypted/META-INF/container.xml'
);

// Parameters for our sample axisnow encrypted book
const parameters = {
  book_vault_uuid: '6734F7F5-C48F-4A38-9AE5-9DF4ADCFBF0A',
  isbn: '9781467784870',
};

/**
 * Note: This test makes an actual call out to the node.axisnow.com API.
 * Therefore it is not a great unit test and is likely to be flakey. It is
 * useful during development, however.
 */
describe.skip('Encrypted Manifest', () => {
  it('Local - Equals the Decrypted version', async () => {
    const decryptor = await Decryptor?.createDecryptor(parameters);
    const fetcher = new LocalFetcher(encryptedPath, decryptor);
    const encryptedEpub = await Epub.build(encryptedPath, fetcher, decryptor);
    const encryptedManifest = await encryptedEpub.webpubManifest;

    const decryptedFetcher = new LocalFetcher(decryptedPath);
    const decryptedEpub = await Epub.build(decryptedPath, decryptedFetcher);
    const decryptedManifest = await decryptedEpub.webpubManifest;

    expect(encryptedManifest).toEqual(decryptedManifest);
  });

  it('Remote - Equals the Decrypted version', async () => {
    const decryptor = await Decryptor?.createDecryptor(parameters);
    const fetcher = new LocalFetcher(encryptedHref, decryptor);
    const encryptedEpub = await Epub.build(encryptedHref, fetcher, decryptor);
    const encryptedManifest = await encryptedEpub.webpubManifest;

    const decryptedFetcher = new LocalFetcher(decryptedHref);
    const decryptedEpub = await Epub.build(decryptedHref, decryptedFetcher);
    const decryptedManifest = await decryptedEpub.webpubManifest;

    expect(encryptedManifest).toEqual(decryptedManifest);
  });
});

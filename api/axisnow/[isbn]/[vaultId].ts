/* eslint-disable camelcase */
import { VercelRequest, VercelResponse } from '@vercel/node';
import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import { validateParam } from '../../../src/utils';
import Epub from '../../../src/Epub';
import RemoteFetcher from '../../../src/RemoteFetcher';

/**
 * This is a handler for Open eBooks Axisnow encrypted EPUBS.
 * http://localhost:3000/api/axisnow/9781467784870/6734F7F5-C48F-4A38-9AE5-9DF4ADCFBF0A
 */
export default async function epubToWebpub(
  req: VercelRequest,
  res: VercelResponse
) {
  const book_vault_uuid = validateParam('vaultId', req.query);
  const isbn = validateParam('isbn', req.query);

  if (!Decryptor) {
    return res.status(500).json({
      title: 'Missing AxisNow Decryptor',
      detail:
        '@nypl-simplified-packages/axisnow-access-control-web package was not included in build.',
      status: 500,
    });
  }

  try {
    const decryptor = await Decryptor.createDecryptor({
      book_vault_uuid,
      isbn,
    });
    const containerXmlHref = decryptor?.containerUrl;
    const fetcher = new RemoteFetcher(containerXmlHref, decryptor);
    const epub = await Epub.build(containerXmlHref, fetcher, {
      decryptor,
      isAxisNow: true,
    });
    const manifest = await epub.webpubManifest;
    res.status(200).json(manifest);
    return;
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(e);
      res.status(500).json({
        title: 'Epub Conversion Failure',
        detail: e.message,
        status: 500,
      });
      return;
    }
    res.status(500).json({
      title: 'Epub Conversion Failure',
      detail: 'Unknown Error',
      status: 500,
    });
    return;
  }
}

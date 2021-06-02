/* eslint-disable camelcase */
import { VercelRequest, VercelResponse } from '@vercel/node';
import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import RemoteExplodedEpub from '../../../RemoteExplodedEpub';

function validateParam(
  name: string,
  query: Record<string, string | string[]>
): string {
  const param = query[name];
  if (typeof param !== 'string') {
    throw new Error(`Parameter ${name} is not a string: ${param}`);
  }
  return param;
}

export default async function epubToWebpub(
  req: VercelRequest,
  res: VercelResponse
) {
  const book_vault_uuid = validateParam('vaultId', req.query);
  const isbn = validateParam('isbn', req.query);
  try {
    const decryptor = await Decryptor?.createDecryptor({
      book_vault_uuid,
      isbn,
    });
    const containerXmlHref = decryptor?.containerUrl;
    const epub = await RemoteExplodedEpub.build(containerXmlHref, {
      decryptor,
    });
    const manifest = epub.webpubManifest;
    res.status(200).json(manifest);
  } catch (e: unknown) {
    if (e instanceof Error) {
      res.status(500).json({
        title: 'Epub Conversion Failure',
        detail: e.message,
        status: 500,
      });
    }
    res.status(500).json({
      title: 'Epub Conversion Failure',
      detail: 'Unknown Error',
      status: 500,
    });
  }
}

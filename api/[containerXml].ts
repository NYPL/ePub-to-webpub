/* eslint-disable camelcase */
import { VercelRequest, VercelResponse } from '@vercel/node';
import RemoteExplodedEpub from '../src/RemoteExplodedEpub';
import { validateParam } from '../src/utils';

/**
 * This is a handler for unencrypted EPUBS
 */
export default async function epubToWebpub(
  req: VercelRequest,
  res: VercelResponse
) {
  const containerXmlHref = validateParam('containerXml', req.query);
  try {
    const epub = await RemoteExplodedEpub.build(containerXmlHref);
    const manifest = epub.webpubManifest;
    res.status(200).json(manifest);
    return;
  } catch (e: unknown) {
    if (e instanceof Error) {
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

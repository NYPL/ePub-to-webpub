import { createServer, IncomingMessage, ServerResponse } from 'http';
import Epub from './Epub';
import RemoteFetcher from './RemoteFetcher';

const handler = async (req: IncomingMessage, resp: ServerResponse) => {
  const path = req.url ? req.url : '/';

  const pathComponents = path.split('/').slice(1);

  if (pathComponents[0] === '') {
    resp.writeHead(200, { 'Content-Type': 'application/json' });
    resp.end(JSON.stringify({ service: 'epub-to-webpub' }), 'utf-8');
  } else if (pathComponents[0] === 'api') {
    const containerXmlHref = decodeURIComponent(pathComponents[1]);

    try {
      const fetcher = new RemoteFetcher(containerXmlHref);
      const epub = await Epub.build(containerXmlHref, fetcher);
      const manifest = await epub.webpubManifest;

      resp.writeHead(200, {
        'Cache-Control': 'maxage=0, s-maxage=1, stale-while-revalidate',
        'Content-Type': 'application/json',
      });
      resp.end(JSON.stringify(manifest), 'utf-8');
    } catch (e: unknown) {
      let detail = 'UnknownError';

      if (e instanceof Error) {
        detail = e.message;
      }

      resp.writeHead(500, { 'Content-Type': 'application/json' });
      resp.end(
        JSON.stringify({ title: 'Epub Conversion Failure', detail }),
        'utf-8'
      );
    }
  } else {
    resp.writeHead(404, { 'Content-Type': 'application/json' });
    resp.end(JSON.stringify({ title: 'Unknown path', detail: path }), 'utf-8');
  }
};

if (process.env.NODE_ENV !== 'test') {
  createServer(async (req, resp) => {
    await handler(req, resp);
  }).listen(5000);
}

module.exports = { handler };

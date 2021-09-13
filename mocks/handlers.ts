import { rest } from 'msw';
import { baseUrl } from '../src/__tests__/constants';
import fs from 'fs';
import path from 'path';
import FileType from 'file-type';

/**
 * Here we set up a single handler to serve filesystem files whenever we
 * make a request. This way we don't mock `fetch` in jest, just intercept
 * the requests and respond with our dummy content.
 */
export const handlers = [
  // Handles a POST /login request
  rest.get(`${baseUrl}/*`, async (req, res, ctx) => {
    const filePath = path.resolve(__dirname, `..${req.url.pathname}`);

    if (!fs.existsSync(filePath)) {
      return res(ctx.status(404));
    }
    // we need to know the file type so we can set it in the response
    const fileType = await FileType.fromFile(filePath);
    const buffer = fs.readFileSync(filePath);

    return res(
      ctx.status(200),
      ctx.set('Content-Length', buffer.byteLength.toString()),
      ctx.set('Content-Type', fileType?.mime ?? 'plain/text'),
      ctx.body(buffer)
    );
  }),
];

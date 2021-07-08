import { ServerResponse, IncomingMessage } from 'http';
import { baseUrl } from './constants';
import { handler } from '../container';

const epubHref = `${baseUrl}/samples/moby-epub3-exploded/META-INF/container.xml`;

describe('Container Handler', () => {
  it('should return JSON manifest on success', async () => {
    const encodedEpubHref = encodeURIComponent(epubHref);
    const testRequest = {
      url: `testServer/api/${encodedEpubHref}`,
    };

    const testMsg = new IncomingMessage({});
    const mockResp = new ServerResponse(testMsg);
    jest.spyOn(mockResp, 'writeHead');
    jest.spyOn(mockResp, 'end');

    await handler(testRequest, mockResp);

    expect(mockResp.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'maxage=0, s-maxage=1, stale-while-revalidate',
    });
    expect(mockResp.end).toHaveBeenCalledTimes(1);
  });

  it('should return static message on root path', async () => {
    const testRequest = {
      url: '',
    };

    const testMsg = new IncomingMessage({});
    const mockResp = new ServerResponse(testMsg);
    jest.spyOn(mockResp, 'writeHead');
    jest.spyOn(mockResp, 'end');

    await handler(testRequest, mockResp);

    expect(mockResp.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(mockResp.end).toHaveBeenLastCalledWith(
      '{"service":"epub-to-webpub"}',
      'utf-8'
    );
  });

  it('should return 404 for other paths', async () => {
    const testRequest = {
      url: 'testServer/testing',
    };

    const testMsg = new IncomingMessage({});
    const mockResp = new ServerResponse(testMsg);
    jest.spyOn(mockResp, 'writeHead');
    jest.spyOn(mockResp, 'end');

    await handler(testRequest, mockResp);

    expect(mockResp.writeHead).toHaveBeenCalledWith(404, {
      'Content-Type': 'application/json',
    });
    expect(mockResp.end).toHaveBeenLastCalledWith(
      `{"title":"Unknown path","detail":"testServer/testing"}`,
      'utf-8'
    );
  });

  it('should return 500 on conversion error', async () => {
    const testRequest = {
      url: 'testServer/api/badURI',
    };

    const testMsg = new IncomingMessage({});
    const mockResp = new ServerResponse(testMsg);
    jest.spyOn(mockResp, 'writeHead');
    jest.spyOn(mockResp, 'end');

    await handler(testRequest, mockResp);

    expect(mockResp.writeHead).toHaveBeenCalledWith(500, {
      'Content-Type': 'application/json',
    });
    expect(mockResp.end).toHaveBeenCalledTimes(1);
  });
});

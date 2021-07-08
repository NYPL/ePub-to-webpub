import { baseUrl } from './constants';
import { handler } from '../lambda';

const epubHref = `${baseUrl}/samples/moby-epub3-exploded/META-INF/container.xml`;

describe('Lambda Handler', () => {
  it('should return JSON manifest on success', async () => {
    const testEvent = {
			pathParameters: {
				containerXml: epubHref
			}
    }

		const testResp = await handler(testEvent, {});

		expect(testResp.statusCode).toEqual(200);
		expect(testResp.headers['Cache-Control']).toEqual('maxage=0, s-maxage=1, stale-while-revalidate');

		const testBody = JSON.parse(testResp.body);

		expect(testBody.metadata.title).toEqual('Moby-Dick');
  })

	it('should return 500 status on error', async () => {
		const testEvent = {
			pathParameters: {
				containerXml: 'invalidURI'
			}
		}

		const testResp = await handler(testEvent, {});

		expect(testResp.statusCode).toEqual(500);
		expect(testResp.headers).toEqual(undefined);

		const testBody = JSON.parse(testResp.body);

		expect(testBody.title).toEqual('Epub Conversion Failure');
	})
})
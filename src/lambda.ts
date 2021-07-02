import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import Epub from './Epub';
import RemoteFetcher from './RemoteFetcher';
import { validateParam } from './utils';

exports.handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const containerXmlHref = validateParam('containerXml', event.pathParameters)

  try {
    const fetcher = new  RemoteFetcher(containerXmlHref);
    const epub = await Epub.build(containerXmlHref, fetcher);
    const manifest = await epub.webpubManifest;

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'maxage=0, s-maxage=1, stale-while-revalidate'
      },
      body: JSON.stringify(manifest)
    }
  } catch (e: unknown) {
    let detail = 'UnknownError';
 
    if (e instanceof Error) {
      detail = e.message
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        title: 'Epub Conversion Failure',
	      detail
      })
    }
  }
}

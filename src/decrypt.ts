/**
 *
 * Normal Process for an Open eBooks Book.
 *  - Use fulfillment link to get url pieces
 *  - Use a secret url template to fetch a license file
 *  - Use another secret url template to get the container.xml file
 *  - Convert that to webpub.
 *
 * - Fetch the fulfillment link, giving you the keys you need to get the license file
 * - Get the keys for the license file.
 * - Source the content.opf file
 * - Either build a publication or just directly build a webpub manifest
 */

// the json you get when you fetch the fulfillment link
// const fulfillmentInfo = {
//   book_vault_uuid: 'F58373FB-6574-45E6-B50E-6D73523AFD01',
//   isbn: '9781467784870',
// };

// const CONTAINER_URL_TEMPLATE =
//   'https://node.axisnow.com/content/stream/{isbn}/META-INF/container.xml';
// const CONTENT_OPF_TEMPLATE =
//   'https://node.axisnow.com/content/stream/{isbn}/OEBPS/content.opf';

// const containerUrl = CONTAINER_URL_TEMPLATE.replace(
//   '{isbn}',
//   `${fulfillmentInfo.isbn}`
// );
// const fullContentOpfUrl = CONTENT_OPF_TEMPLATE.replace(
//   '{isbn}',
//   `${fulfillmentInfo.isbn}`
// );

// console.log(`Container Url: ${containerUrl}`);
// console.log(`Content.opf url: ${fullContentOpfUrl}`);

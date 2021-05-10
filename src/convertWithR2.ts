import { PublicationParsePromise } from 'r2-shared-js/dist/es8-es2017/src/parser/publication-parser';
import { extractEPUB_ManifestJSON } from 'r2-shared-js/dist/es8-es2017/src/_utils/extractEpubManifestJson';

export default async function convertWithR2(path: string): Promise<any> {
  console.log(`Converting from: ${path}`);

  const pub = await PublicationParsePromise(path);

  //extrac the manifest
  const manifest = extractEPUB_ManifestJSON(pub, undefined);

  // console.log(pub);

  // get the manifest
  // const manifest = JSON.stringify(pub);

  return manifest;
}

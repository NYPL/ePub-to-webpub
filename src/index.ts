import { constructManifest } from './construct-manifest';
import LocalExplodedEpub from './LocalExplodedEpub';

export async function localExploded(containerXmlPath: string) {
  const epub = await LocalExplodedEpub.build(containerXmlPath);

  // encode into Webpub Manifest
  const manifest = constructManifest(epub);

  return manifest;
}

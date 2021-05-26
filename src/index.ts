import { epubToManifest } from './convert';
import LocalExplodedEpub from './LocalExplodedEpub';

export async function localExploded(containerXmlPath: string) {
  const epub = await LocalExplodedEpub.build(containerXmlPath);

  // encode into Webpub Manifest
  const manifest = epubToManifest(epub);

  return manifest;
}

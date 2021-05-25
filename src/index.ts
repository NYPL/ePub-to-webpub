import path from 'path';
import { constructManifest } from './construct-manifest';
import LocalExplodedEpub from './LocalEpub';

/**
 * - Source the necessary files
 * - Deserialize them into custom classes
 * - Use them to construct the manifest
 */
export async function localExploded(containerXmlPath: string) {
  const epub = await LocalExplodedEpub.build(containerXmlPath);

  // encode into Webpub Manifest
  const manifest = constructManifest(epub);

  return manifest;
}

// the entrypoint is a container.xml file. We can change this
// later to be just the folder itself if we want.
const containerXmlPath = path.resolve(
  __dirname,
  '../samples/moby-epub-exploded/META-INF/container.xml'
);

localExploded(containerXmlPath);

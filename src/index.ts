import fs from 'fs';
import path from 'path';
import { constructManifest } from './construct-manifest';
import { getOpfPath, parseContainer, parseOpf } from './deserialize';

/**
 * - Source the necessary files
 * - Deserialize them into custom classes
 * - Use them to construct the manifest
 */
async function localExploded() {
  // the entrypoint is a container.xml file. We can change this
  // later to be just the folder itself if we want.
  const containerXmlPath = path.resolve(
    __dirname,
    '../samples/moby-epub-exploded/META-INF/container.xml'
  );
  // next we need in-memory representations of the container, content.opf, toc.ncx, etc
  // we will need to load, parse, and deserialize each using the XML utility of r2-utils-js
  const containerXmlStr = fs.readFileSync(containerXmlPath, 'utf-8');
  const container = parseContainer(containerXmlStr);

  // get the opf path from the container
  const opfPath = getOpfPath(container);
  // get the opf file
  const opfStr = fs.readFileSync(opfPath, 'utf-8');
  // deserialize
  const opf = await parseOpf(opfStr);

  // encode into Webpub Manifest
  const manifest = constructManifest(opf);

  return manifest;
}

localExploded();

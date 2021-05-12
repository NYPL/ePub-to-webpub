/**
 * This is a working file.
 *
 * Features needed:
 *  - Local, packed ePub
 *  - Local, unpacked ePub
 *  - Remote, packed ePub
 *  - Remote, unpacked ePub
 *  - AxisNow Encrypted ePub
 */
import fs from 'fs';
import path from 'path';
import { DOMParser } from 'xmldom';
import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { XML } from 'r2-utils-js/dist/es8-es2017/src/_utils/xml-js-mapper';
import { getOpfPath, decodeContainer, decodeOpf } from './decode';

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
  const container = decodeContainer(containerXmlStr);

  // get the opf path from the container
  const opfPath = getOpfPath(container);
  // get the opf file
  const opfStr = fs.readFileSync(opfPath, 'utf-8');
  // decode the opf
  const opf = decodeOpf(opfStr);

  // encode into Webpub Manifest
  const manifest = encodeManifest(opf);
}

async function remoteExploded() {}

localExploded();

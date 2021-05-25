import fs from 'fs';
import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import {
  getNcxHref,
  getOpfPath,
  parseContainer,
  parseNcx,
  parseOpf,
} from './deserialize';
import path from 'path';
import Epub from './Epub';

/**
 * A class to handle the getting of resources for a local exploded
 * EPUB.
 * We need in-memory representations of the container, content.opf, toc.ncx, etc
 * We will need to load, parse, and deserialize each using the XML utility of r2-utils-js
 */
export default class LocalExplodedEpub extends Epub {
  private constructor(
    containerXmlPath: string,
    folderPath: string,
    container: Container,
    opf: OPF,
    ncx: Document | undefined
  ) {
    super(containerXmlPath, folderPath, container, opf, ncx);
  }


  async build(containerXmlPath: string) {
    const folderPath = containerXmlPath.replace('META-INF/container.xml', '');
    const container = parseContainer(await this.getFileStr(containerXmlPath));
    const opfPath = path.resolve(folderPath, getOpfPath(container));
    const opf = await parseOpf(await this.getFileStr(opfPath));

    // the TOC href lives in the opf.Manifest
    const ncxHref = getNcxHref(opf);
    const tocStr = ncxHref
      ? fs.readFileSync(path.resolve(folderPath, 'OEBPS/', ncxHref), 'utf-8')
      : undefined;
    const ncx = parseNcx(tocStr);

    return new LocalExplodedEpub(
      containerXmlPath,
      folderPath,
      container,
      opf,
      ncx
    );
  }

  getFileStr(path: string): Promise<string> {
    return Promise.resolve(fs.readFileSync(path, 'utf-8'));
  }

  async getBuffer(src: string): Promise<Buffer> {
    const str = await this.getFileStr(src);
    const buffer = Buffer.from(str);
    return Promise.resolve(buffer);
  }
}

import fs from 'fs';
import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import path from 'path';
import Epub from './Epub';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';

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
    ncx: NCX | undefined
  ) {
    super(containerXmlPath, folderPath, container, opf, ncx);
  }

  static async build(containerXmlPath: string) {
    const folderPath = containerXmlPath.replace('META-INF/container.xml', '');
    const container = Epub.parseContainer(
      await LocalExplodedEpub.getFileStr(folderPath, containerXmlPath)
    );
    const opfPath = path.resolve(folderPath, Epub.getOpfPath(container));
    const opf = await Epub.parseOpf(
      await LocalExplodedEpub.getFileStr(folderPath, opfPath)
    );

    // the TOC href lives in the opf.Manifest
    const ncxHref = Epub.getNcxHref(opf);
    const ncxStr = ncxHref
      ? await LocalExplodedEpub.getFileStr(folderPath, 'OEBPS/', ncxHref)
      : undefined;
    const ncx = Epub.parseNcx(ncxStr);

    return new LocalExplodedEpub(
      containerXmlPath,
      folderPath,
      container,
      opf,
      ncx
    ) as Epub;
  }

  /**
   * We need an instance and a static getFileStr method as we need the
   * method in the `build` function as well as normally, and we can't
   * enforce a static abstract method in the abstract Epub class sadly.
   */
  static getFileStr(...paths: string[]): Promise<string> {
    const fullPath = path.resolve(...paths);
    return Promise.resolve(fs.readFileSync(fullPath, 'utf-8'));
  }
  getFileStr(path: string): Promise<string> {
    return LocalExplodedEpub.getFileStr(this.folderPath, path);
  }

  getFullHref(relative: string): string {
    return path.resolve(this.folderPath, relative);
  }
}

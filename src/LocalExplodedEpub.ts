import fs from 'fs';
import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import path from 'path';
import Epub from './Epub';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import sizeOf from 'image-size';

/**
 * Extends the Epub class to add support for locally
 * sourced, exploded EPUBs.
 */
export default class LocalExplodedEpub extends Epub {
  static description = 'Local Exploded Epub';
  private constructor(
    containerXmlPath: string,
    folderPath: string,
    container: Container,
    opf: OPF,
    ncx: NCX | undefined,
    navDoc: Document | undefined
  ) {
    super(containerXmlPath, folderPath, container, opf, ncx, navDoc);
  }

  static async build(containerXmlPath: string) {
    const folderPath = containerXmlPath.replace(this.CONTAINER_PATH, '');
    const container = Epub.parseContainer(
      await LocalExplodedEpub.getFileStr(containerXmlPath)
    );
    const rootfile = Epub.getRootfile(container);
    const opfPath = path.resolve(folderPath, Epub.getOpfPath(container));
    const opf = await Epub.parseOpf(
      await LocalExplodedEpub.getFileStr(folderPath, opfPath)
    );

    const ncxHref = Epub.getNcxHref(opf);
    const ncxStr = ncxHref
      ? await LocalExplodedEpub.getFileStr(
          folderPath,
          Epub.getContentPath(rootfile, opf),
          ncxHref
        )
      : undefined;
    const ncx = Epub.parseNcx(ncxStr);

    const navDocHref = Epub.getNavDocHref(opf);
    const navDocStr = navDocHref
      ? await LocalExplodedEpub.getFileStr(
          folderPath,
          Epub.getContentPath(rootfile, opf),
          navDocHref
        )
      : undefined;
    const navDoc = Epub.parseNavDoc(navDocStr);

    return new LocalExplodedEpub(
      containerXmlPath,
      folderPath,
      container,
      opf,
      ncx,
      navDoc
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
    return LocalExplodedEpub.getFileStr(
      this.folderPath,
      this.contentPath,
      path
    );
  }

  getRelativeHref(relative: string): string {
    return `${this.contentPath}${relative}`;
  }

  getAbsoluteHref(relative: string): string {
    const abs = path.resolve(this.folderPath, this.contentPath, relative);
    return abs;
  }

  async getImageDimensions(relativePath: string) {
    const path = this.getAbsoluteHref(relativePath);
    const { width, height } = sizeOf(path) ?? {};
    if (typeof width === 'number' && typeof height === 'number') {
      return { width, height };
    }
    return undefined;
  }
}

import fs from 'fs';
import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import path from 'path';
import Epub from './Epub';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import sizeOf from 'image-size';
import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import { EpubOptions } from './types';

/**
 * Extends the Epub class to add support for locally
 * sourced, exploded EPUBs.
 */
export default class LocalExplodedEpub extends Epub {
  static description = 'Local Exploded Epub';
  private constructor(
    containerXmlPath: string,
    folderPath: string,
    opfPath: string,
    container: Container,
    opf: OPF,
    ncx: NCX | undefined,
    navDoc: Document | undefined,
    decryptor?: Decryptor
  ) {
    super(
      containerXmlPath,
      folderPath,
      opfPath,
      container,
      opf,
      ncx,
      navDoc,
      decryptor
    );
  }

  static async build(
    containerXmlPath: string,
    options: EpubOptions = { decryptor: undefined }
  ) {
    const { decryptor } = options;
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
    const ncxBuffer = ncxHref
      ? await LocalExplodedEpub.getArrayBuffer(
          folderPath,
          Epub.getContentPath(rootfile, opf),
          ncxHref
        )
      : undefined;
    const ncxStr = await Epub.decryptStr(ncxBuffer, decryptor);
    const ncx = Epub.parseNcx(ncxStr);

    const navDocHref = Epub.getNavDocHref(opf);
    const navDocBuffer = navDocHref
      ? await LocalExplodedEpub.getArrayBuffer(
          folderPath,
          Epub.getContentPath(rootfile, opf),
          navDocHref
        )
      : undefined;
    const navDocStr = await Epub.decryptStr(navDocBuffer, decryptor);
    const navDoc = Epub.parseNavDoc(navDocStr);

    return new LocalExplodedEpub(
      containerXmlPath,
      folderPath,
      opfPath,
      container,
      opf,
      ncx,
      navDoc,
      decryptor
    ) as Epub;
  }
  /**
   * We need an instance and a static multiple methods as we need the
   * method in the `build` function as well as normally, and we can't
   * enforce a static abstract method in the abstract Epub class sadly.
   */

  static async getArrayBuffer(path: string): Promise<ArrayBuffer> {
    const fullPath = path.resolve(...paths);
    const buffer = fs.readFileSync(fullPath, null);
    return Promise.resolve(buffer);
  }
  async getArrayBuffer(...paths: string[]): Promise<ArrayBuffer> {
    return LocalExplodedEpub.getArrayBuffer(...paths);
  }

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

  resolvePath(from: string, to: string): string {
    return path.resolve(from, to);
  }
  resolveRelativePath(from: string, to: string): string {
    return this.resolvePath(from, to).replace(this.folderPath, '');
  }

  /**
   * You must pass this function the absolute path to the image
   */
  async getImageDimensions(path: string) {
    /**
     * If the decryptor is defined, we read the file as a buffer, decrypt it
     * and pass that to sizeOf. Otherwise we just pass the path and let it
     * read the file internally.
     */
    let arg: string | Buffer = path;
    if (this.decryptor) {
      const buffer = await this.getArrayBuffer(path);
      arg = Buffer.from(await Epub.decryptAb(buffer, this.decryptor));
    }
    const { width, height } = sizeOf(arg) ?? {};
    if (typeof width === 'number' && typeof height === 'number') {
      return { width, height };
    }
    return undefined;
  }
}

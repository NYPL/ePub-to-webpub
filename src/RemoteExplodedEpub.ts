import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import Epub from './Epub';
import fetch from 'node-fetch';
import sizeOf from 'image-size';
import { EpubOptions } from './types';
import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
export default class RemoteExplodedEpub extends Epub {
  static description = 'Remote Exploded Epub';

  private constructor(
    containerXmlPath: string,
    folderPath: string,
    container: Container,
    opf: OPF,
    ncx: NCX | undefined,
    navDoc: Document | undefined,
    decryptor?: Decryptor
  ) {
    super(containerXmlPath, folderPath, container, opf, ncx, navDoc, decryptor);
  }

  static async build(
    containerXmlPath: string,
    options: EpubOptions = { decryptor: undefined }
  ) {
    const { decryptor } = options;
    const folderPath = containerXmlPath.replace(this.CONTAINER_PATH, '');
    const container = Epub.parseContainer(
      await RemoteExplodedEpub.getFileStr(containerXmlPath)
    );
    const rootfile = Epub.getRootfile(container);
    const opfPath = new URL(Epub.getOpfPath(container), folderPath).toString();
    const opf = await Epub.parseOpf(
      await RemoteExplodedEpub.getFileStr(opfPath)
    );

    const ncxHref = Epub.getNcxHref(opf);
    const ncxBuffer = ncxHref
      ? await RemoteExplodedEpub.getArrayBuffer(
          folderPath,
          Epub.getContentPath(rootfile, opf),
          ncxHref
        )
      : undefined;
    const ncxStr = await Epub.decryptStr(ncxBuffer, decryptor);
    const ncx = Epub.parseNcx(ncxStr);

    const navDocHref = Epub.getNavDocHref(opf);
    const navDocBuffer = navDocHref
      ? await RemoteExplodedEpub.getArrayBuffer(
          folderPath,
          Epub.getContentPath(rootfile, opf),
          navDocHref
        )
      : undefined;
    const navDocStr = await Epub.decryptStr(navDocBuffer, decryptor);
    const navDoc = Epub.parseNavDoc(navDocStr);

    return new RemoteExplodedEpub(
      containerXmlPath,
      folderPath,
      container,
      opf,
      ncx,
      navDoc,
      decryptor
    ) as Epub;
  }

  static async getArrayBuffer(...paths: string[]): Promise<ArrayBuffer> {
    const url = paths.join('');
    const result = await RemoteExplodedEpub.fetch(url);
    return await result.arrayBuffer();
  }
  async getArrayBuffer(...paths: []): Promise<ArrayBuffer> {
    return RemoteExplodedEpub.getArrayBuffer(...paths);
  }

  /**
   * Fetch a file and throw an error if the response is not ok.
   */
  static async fetch(url: string): Promise<ReturnType<typeof fetch>> {
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`Could not fetch at: ${url}`);
    }
    return result;
  }

  static async getFileStr(...paths: string[]): Promise<string> {
    const url = paths.join('');
    const result = await RemoteExplodedEpub.fetch(url);
    return await result.text();
  }
  getFileStr(path: string) {
    return RemoteExplodedEpub.getFileStr(
      this.folderPath,
      this.contentPath,
      path
    );
  }

  getRelativeHref(relative: string) {
    return `${this.contentPath}${relative}`;
  }
  getAbsoluteHref(relative: string): URL {
    return new URL(relative, new URL(this.contentPath, this.folderPath));
  }
  async getImageDimensions(relativePath: string) {
    const url = this.getAbsoluteHref(relativePath);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not fetch image at: ${url.toString()}`);
    }
    const buffer = await response.buffer();
    const decrypted = await Epub.decryptAb(buffer, this.decryptor);
    const { width, height } = sizeOf(Buffer.from(decrypted)) ?? {};
    if (typeof width === 'number' && typeof height === 'number') {
      return { width, height };
    }
    return undefined;
  }
}

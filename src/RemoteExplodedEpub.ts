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
    // used to resolve items relative to the opf file
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
      await RemoteExplodedEpub.getFileStr(containerXmlPath)
    );
    const relativeOpfPath = Epub.getOpfPath(container);
    const opfHref = RemoteExplodedEpub.resolvePath(folderPath, relativeOpfPath);
    const opf = await Epub.parseOpf(
      await RemoteExplodedEpub.getFileStr(opfHref)
    );

    const relativeNcxPath = Epub.getNcxHref(opf);
    const ncxHref = relativeNcxPath
      ? RemoteExplodedEpub.resolvePath(opfHref, relativeNcxPath)
      : undefined;
    const ncxBuffer = ncxHref
      ? await RemoteExplodedEpub.getArrayBuffer(ncxHref)
      : undefined;
    const ncxStr = await Epub.decryptStr(ncxBuffer, decryptor);
    const ncx = Epub.parseNcx(ncxStr);

    const relativeNavDocPath = Epub.getNavDocHref(opf);
    const navDocHref = relativeNavDocPath
      ? RemoteExplodedEpub.resolvePath(opfHref, relativeNavDocPath)
      : undefined;
    const navDocBuffer = navDocHref
      ? await RemoteExplodedEpub.getArrayBuffer(navDocHref)
      : undefined;
    const navDocStr = await Epub.decryptStr(navDocBuffer, decryptor);
    const navDoc = Epub.parseNavDoc(navDocStr);

    return new RemoteExplodedEpub(
      containerXmlPath,
      folderPath,
      opfHref,
      container,
      opf,
      ncx,
      navDoc,
      decryptor
    ) as Epub;
  }

  static async getArrayBuffer(url: string): Promise<ArrayBuffer> {
    const result = await RemoteExplodedEpub.fetch(url);
    return await result.arrayBuffer();
  }
  async getArrayBuffer(url: string): Promise<ArrayBuffer> {
    return RemoteExplodedEpub.getArrayBuffer(url);
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

  static async getFileStr(url: string): Promise<string> {
    const result = await RemoteExplodedEpub.fetch(url);
    return await result.text();
  }
  getFileStr(url: string) {
    return RemoteExplodedEpub.getFileStr(url);
  }

  static resolvePath(from: string, to: string): string {
    return new URL(to, from).toString();
  }
  resolvePath(from: string, to: string): string {
    return RemoteExplodedEpub.resolvePath(from, to);
  }
  resolveRelativePath(from: string, to: string): string {
    return RemoteExplodedEpub.resolvePath(from, to).replace(
      this.folderPath,
      ''
    );
  }

  async getImageDimensions(relativePath: string) {
    const url = this.resolvePath(this.folderPath, relativePath);
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

import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import Epub from './Epub';
import fetch from 'node-fetch';
import sizeOf from 'image-size';
export default class RemoteExplodedEpub extends Epub {
  static description = 'Remote Exploded Epub';

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
      await RemoteExplodedEpub.getFileStr(containerXmlPath)
    );
    const rootfile = Epub.getRootfile(container);
    const opfPath = new URL(Epub.getOpfPath(container), folderPath).toString();
    const opf = await Epub.parseOpf(
      await RemoteExplodedEpub.getFileStr(opfPath)
    );

    const ncxHref = Epub.getNcxHref(opf);
    const ncxStr = ncxHref
      ? await RemoteExplodedEpub.getFileStr(
          folderPath,
          Epub.getContentPath(rootfile, opf),
          ncxHref
        )
      : undefined;
    const ncx = Epub.parseNcx(ncxStr);

    const navDocHref = Epub.getNavDocHref(opf);
    const navDocStr = navDocHref
      ? await RemoteExplodedEpub.getFileStr(
          folderPath,
          Epub.getContentPath(rootfile, opf),
          navDocHref
        )
      : undefined;
    const navDoc = Epub.parseNavDoc(navDocStr);

    return new RemoteExplodedEpub(
      containerXmlPath,
      folderPath,
      container,
      opf,
      ncx,
      navDoc
    ) as Epub;
  }

  static async getFileStr(...paths: string[]): Promise<string> {
    const url = paths.join('');
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`Could not fetch at: ${url}.`);
    }
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
    const { width, height } = sizeOf(buffer) ?? {};
    if (typeof width === 'number' && typeof height === 'number') {
      return { width, height };
    }
    return undefined;
  }
}

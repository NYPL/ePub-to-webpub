import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import Epub from './Epub';
import path from 'path';
import fetch from 'node-fetch';

export default class RemoteExplodedEpub extends Epub {
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
    const opfPath = path.resolve(folderPath, Epub.getOpfPath(container));
    const opf = await Epub.parseOpf(
      await RemoteExplodedEpub.getFileStr(folderPath, opfPath)
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
    console.log(url);
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
  getAbsoluteHref(relative: string) {
    return path.resolve(this.folderPath, this.contentPath, relative);
  }
}

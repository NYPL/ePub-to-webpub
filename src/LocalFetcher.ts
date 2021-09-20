import fs from 'fs';
import path from 'path';
import Epub from './Epub';
import sizeOf from 'image-size';
import { ImageDimensions } from './types';
import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import Fetcher from './Fetcher';

export default class LocalFetcher extends Fetcher {
  constructor(
    public readonly containerXmlPath: string,
    public readonly decryptor?: Decryptor
  ) {
    super(
      containerXmlPath,
      path.resolve(containerXmlPath, '../../').toString(),
      decryptor
    );
  }

  getOpfPath(relativeOpfPath: string): string {
    return path.resolve(this.containerXmlPath, '../../', relativeOpfPath);
  }

  resolvePath(from: string, to: string): string {
    return path.resolve(from, '../', to);
  }
  resolveRelativePath(from: string, to: string): string {
    const fullPath = this.resolvePath(from, to);
    return path.relative(this.folderPath, fullPath);
  }
  async getArrayBuffer(path: string): Promise<ArrayBuffer> {
    const buffer = fs.readFileSync(path, null);
    return Promise.resolve(buffer);
  }

  getFileStr(path: string): Promise<string> {
    return Promise.resolve(fs.readFileSync(path, 'utf-8'));
  }

  async getOptionalFileStr(path: string): Promise<string | undefined> {
    if (!fs.existsSync(path)) {
      return undefined;
    }
    return this.getFileStr(path);
  }

  /**
   * You must pass this function the absolute path to the image
   */
  async getImageDimensions(path: string): Promise<ImageDimensions | undefined> {
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

  getEncryptionPath(containerXmlPath: string) {
    return path.resolve(path.dirname(containerXmlPath), 'encryption.xml');
  }
}

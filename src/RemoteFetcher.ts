import Epub from './Epub';
import fetch from 'node-fetch';
import sizeOf from 'image-size';
import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import Fetcher from './Fetcher';

export default class RemoteFetcher extends Fetcher {
  constructor(
    public readonly containerXmlPath: string,
    public readonly decryptor?: Decryptor
  ) {
    super(
      containerXmlPath,
      new URL('../', containerXmlPath).toString(),
      decryptor
    );
  }

  /**
   * Fetch a file and throw an error if the response is not ok.
   */
  async fetch(url: string): Promise<ReturnType<typeof fetch>> {
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`Could not fetch at: ${url}`);
    }
    return result;
  }

  async getArrayBuffer(url: string): Promise<ArrayBuffer> {
    const result = await this.fetch(url);
    return await result.arrayBuffer();
  }

  async getFileStr(url: string) {
    const result = await this.fetch(url);
    return await result.text();
  }

  async getOptionalFileStr(url: string) {
    const response = await fetch(url);
    if (response.ok) {
      return await response.text();
    }
    return undefined;
  }

  getOpfPath(relativeOpfPath: string): string {
    return this.resolvePath(this.folderPath, relativeOpfPath);
  }

  resolvePath(from: string, to: string): string {
    return new URL(to, from).toString();
  }
  resolveRelativePath(from: string, to: string): string {
    return this.resolvePath(from, to).replace(this.folderPath, '');
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

  getEncryptionPath(containerXmlPath: string) {
    return new URL('encryption.xml', containerXmlPath).toString();
  }
}

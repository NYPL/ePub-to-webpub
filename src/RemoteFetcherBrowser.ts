import type Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import Fetcher from './Fetcher';

/**
 * This is a version of the RemoteFetcher that is compatible browser environments.
 * It specifically does not implement the `getImageDimensions` method, which in the
 * server version, uses the `image-size` package.
 */
export class RemoteFetcherBrowser extends Fetcher {
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

  /**
   * Returns the OPF path relative to the root of the EPUB.
   */
  getOpfPath(relativeOpfPath: string): string {
    return this.resolvePath(this.folderPath, relativeOpfPath);
  }

  /**
   * Resolves a path from an absolute URL to a relative URL.
   */
  resolvePath(from: string, to: string): string;
  resolvePath(from: string, to: string | undefined): string | undefined {
    if (typeof to !== 'string') return undefined;
    return new URL(to, from).toString();
  }

  resolveRelativePath(from: string, to: string): string;
  resolveRelativePath(
    from: string,
    to: string | undefined
  ): string | undefined {
    if (typeof to !== 'string') return undefined;
    return this.resolvePath(from, to).replace(this.folderPath, '');
  }

  resolveHref(from: string, to: string, relative: boolean) {
    return relative
      ? this.resolveRelativePath(from, to)
      : this.resolvePath(from, to);
  }

  createPathToFileInMetaInf(containerXmlPath: string, fileName: string) {
    return new URL(fileName, containerXmlPath).toString();
  }

  /**
   * In the browser implementation, we don't have a way to get the dimensions of the image.
   */
  async getImageDimensions(
    _relativePath: string
  ): Promise<undefined | { width: number; height: number }> {
    return undefined;
  }
}

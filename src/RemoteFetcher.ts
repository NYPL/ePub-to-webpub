import Epub from './Epub';
import sizeOf from 'image-size';
import { RemoteFetcherBrowser } from './RemoteFetcherBrowser';

/**
 * This version of the RemoteFetcher is used in Node.js environments.
 * It includes image sizing ability, which is not compatible with browser
 * environments due to the use of the `image-size` package.
 */
export default class RemoteFetcher extends RemoteFetcherBrowser {
  async getImageDimensions(relativePath: string) {
    if (typeof window !== 'undefined') return undefined;
    const url = this.resolvePath(this.folderPath, relativePath);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not fetch image at: ${url.toString()}`);
    }
    const buffer = await response.arrayBuffer();
    const decrypted = await Epub.decryptAb(buffer, this.decryptor);
    const { width, height } = sizeOf(Buffer.from(decrypted)) ?? {};
    if (typeof width === 'number' && typeof height === 'number') {
      return { width, height };
    }
    return undefined;
  }
}

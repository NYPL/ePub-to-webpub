import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import { ImageDimensions } from './types';

export default abstract class Fetcher {
  constructor(
    public readonly folderPath: string,
    public readonly decryptor?: Decryptor
  ) {}

  abstract resolvePath(from: string, to: string): string;
  abstract resolveRelativePath(from: string, to: string): string;

  // the following functions take absolute paths/hrefs
  abstract async getArrayBuffer(path: string): Promise<ArrayBuffer>;
  abstract async getFileStr(path: string): Promise<string>;
  abstract async getImageDimensions(
    path: string
  ): Promise<ImageDimensions | undefined>;
}

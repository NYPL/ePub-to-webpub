import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import Fetcher from './Fetcher';

export type EpubVersion = '2' | '3';

export type EpubOptions = {
  decryptor?: Decryptor;
  fetcher?: Fetcher;
};

export type ImageDimensions = {
  width?: number;
  height?: number;
};

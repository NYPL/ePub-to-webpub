import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';

export type EpubVersion = '2' | '3';

export type EpubOptions = {
  decryptor?: Decryptor;
};

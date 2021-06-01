export type EpubVersion = '2' | '3';

export type EpubOptions = {
  decryptor?: Decryptor;
};

/**
 * This is a copy of the Decryptor interface from axisnow-access-control-web,
 * which is a private package and therefore not guaranteed to be installable.
 */
export interface Decryptor {
  createDecryptor({
    book_vault_uuid,
    isbn,
  }: DecryptorParams): Promise<Decryptor>;
  getEntryUrl(): string;
  decrypt(encrypted: Uint8Array): Promise<Uint8Array>;
  decryptStr(encrypted: Uint8Array): Promise<string>;
  decryptUrl(resourceUrl: string): Promise<Uint8Array>;
}

type DecryptorParams = {
  book_vault_uuid: string;
  isbn: string;
};

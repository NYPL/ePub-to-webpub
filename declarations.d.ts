declare module '@nypl-simplified-packages/axisnow-access-control-web' {
  /**
   * This is a copy of the Decryptor interface from axisnow-access-control-web,
   * which is a private package and therefore not guaranteed to be installable.
   */
  type DecryptorParams = {
    book_vault_uuid?: string;
    isbn?: string;
  };
  export default class Decryptor {
    readonly keyPair: CryptoKeyPair;
    readonly contentKey: CryptoKey;
    readonly containerUrl: string;
    static createDecryptor({
      book_vault_uuid,
      isbn,
    }: DecryptorParams): Promise<Decryptor>;
    private constructor();
    getEntryUrl(): string;
    decrypt(encrypted: Uint8Array): Promise<Uint8Array>;
    decryptStr(encrypted: Uint8Array): Promise<string>;
    decryptUrl(resourceUrl: string): Promise<Uint8Array>;
  }
}

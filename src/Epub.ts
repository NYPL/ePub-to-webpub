import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import { Encryption } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/encryption';
import { DCMetadata } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-dc-metadata';
import { Metafield } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-metafield';
import { XML } from 'r2-utils-js/dist/es8-es2017/src/_utils/xml-js-mapper';
import { DOMParser } from 'xmldom';
import { EpubVersion } from './types';
import { Rootfile } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container-rootfile';
import { WebpubManifest } from './WebpubManifestTypes/WebpubManifest';
import { epubToManifest } from './convert';
import Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import Fetcher from './Fetcher';
import { getEncryptionInfo } from './convert/encryption';

/**
 * This class represents a complete EPUB. It is abstract
 * because it is meant to be subclassed to support various
 * ways an EPUB can be sourced:
 *  - Local (filesystem) exploded EPUB
 *  - Local packaged EPUB
 *  - Remote (external server) exploded EPUB
 *  - Remote packaged EPUB
 *
 * This class includes utilites used to parse the string file values
 * into in-memory representations and to extract values from the various
 * data structures. They will be used by all subclasses.
 *
 * @todo : The TOC file we use should be whatever is mentioned as the 'nav' property in the
 *         oebps-package+xml file, according to leonard. We currently always look for both an
 *         optional NCX file and an optional NavDoc, and then choose one based on if it is EPUB 2 or 3.
 */
export default class Epub {
  static NCX_MEDIA_TYPE = 'application/x-dtbncx+xml';

  constructor(
    public readonly fetcher: Fetcher,
    private readonly containerXmlPath: string,
    // whether the resulting manifest should contain relative or absolute hrefs
    // defaults to relative
    public readonly useRelativeHrefs: boolean,
    // used to resolve items relative to the opf file
    public readonly opfPath: string,
    public readonly container: Container,
    public readonly opf: OPF,
    // EPUB 2 uses NCX, EPUB 3 uses NavDoc
    public readonly ncxPath: string | undefined,
    public readonly ncx: NCX | undefined,
    public readonly navDocPath: string | undefined,
    public readonly navDoc: Document | undefined,
    // the encryption file tells you which resources are encrypted
    public readonly encryptionDoc: Encryption | undefined,
    // pass a decryptor to have all files except container.xml and opf run through it
    public readonly decryptor?: Decryptor,
    // if it is an AxisNow publication, we will set a custom encryption scheme.
    public readonly isAxisNow?: boolean
  ) {}

  public static async build(
    containerXmlPath: string,
    fetcher: Fetcher,
    options: {
      useRelativeHrefs?: boolean;
      decryptor?: Decryptor;
      isAxisNow?: boolean;
    } = {}
  ) {
    const {
      useRelativeHrefs = true,
      decryptor = undefined,
      isAxisNow = false,
    } = options;

    const container = Epub.parseContainer(
      await fetcher.getFileStr(containerXmlPath)
    );
    const relativeOpfPath = Epub.getOpfPath(container);
    const opfPath = fetcher.getOpfPath(relativeOpfPath);
    const opf = await Epub.parseOpf(await fetcher.getFileStr(opfPath));

    // if there is no encryption path, the encryptionDoc will be undefined
    // and the EPUB will be assumed unencrypted.
    const encryptionPath = fetcher.getEncryptionPath(containerXmlPath);
    const encryptionStr = await fetcher.getOptionalFileStr(encryptionPath);
    const encryptionDoc = Epub.parseEncryptionDoc(encryptionStr);

    // ncx file
    const ncxHref = Epub.getNcxHref(opf);
    const relativeNcxPath = Epub.resolvePathToOpfPath(
      fetcher,
      opfPath,
      ncxHref
    );
    const ncxPath = relativeNcxPath
      ? fetcher.resolvePath(opfPath, relativeNcxPath)
      : undefined;

    let ncx: NCX | undefined = undefined;
    if (ncxPath && relativeNcxPath) {
      // it is encrypted if there is an entry for it in encryption.xml
      const ncxIsEncrypted = !!getEncryptionInfo(
        encryptionDoc,
        relativeNcxPath,
        isAxisNow
      );
      if (ncxIsEncrypted) {
        const ncxBuffer = ncxPath
          ? await fetcher.getArrayBuffer(ncxPath)
          : undefined;
        const ncxStr = await Epub.decryptStr(ncxBuffer, decryptor);
        ncx = Epub.parseNcx(ncxStr);
      } else {
        const ncxStr = await fetcher.getFileStr(ncxPath);
        ncx = Epub.parseNcx(ncxStr);
      }
    }

    // navdoc file
    const navDocHref = Epub.getNavDocHref(opf);
    const relativeNavDocPath = Epub.resolvePathToOpfPath(
      fetcher,
      opfPath,
      navDocHref
    );
    const navDocPath = relativeNavDocPath
      ? fetcher.resolvePath(opfPath, relativeNavDocPath)
      : undefined;

    let navDoc: Document | undefined = undefined;
    if (navDocPath && relativeNavDocPath) {
      const isNavDocEncrypted = !!getEncryptionInfo(
        encryptionDoc,
        relativeNavDocPath,
        isAxisNow
      );
      if (isNavDocEncrypted) {
        const navDocBuffer = navDocPath
          ? await fetcher.getArrayBuffer(navDocPath)
          : undefined;
        const navDocStr = await Epub.decryptStr(navDocBuffer, decryptor);
        navDoc = Epub.parseNavDoc(navDocStr);
      } else {
        const navDocStr = await fetcher.getFileStr(navDocPath);
        navDoc = Epub.parseNavDoc(navDocStr);
      }
    }

    return new Epub(
      fetcher,
      containerXmlPath,
      useRelativeHrefs,
      opfPath,
      container,
      opf,
      ncxPath,
      ncx,
      navDocPath,
      navDoc,
      encryptionDoc,
      decryptor,
      isAxisNow
    );
  }

  ///////////////////
  // ACCESSOR METHODS AND UTILS
  // We need static and instance methods of these because the static version is
  // used in the subclass's `build` method
  ///////////////////

  static getVersion(rootfile: Rootfile | undefined, opf: OPF): EpubVersion {
    const versionNumber = rootfile?.Version ?? opf.Version;
    return versionNumber.startsWith('3') ? '3' : '2';
  }
  get version(): EpubVersion {
    return Epub.getVersion(this.rootfile, this.opf);
  }

  static getRootfile(container: Container): Rootfile | undefined {
    return container.Rootfile[0];
  }
  get rootfile(): Rootfile | undefined {
    return Epub.getRootfile(this.container);
  }

  static getContentPath(rootfile: Rootfile | undefined, opf: OPF): string {
    return Epub.getVersion(rootfile, opf) === '2' ? 'OEBPS/' : 'OPS/';
  }
  get contentPath(): string {
    return Epub.getContentPath(this.rootfile, this.opf);
  }

  get webpubManifest(): Promise<WebpubManifest> {
    return epubToManifest(this);
  }

  ///////////////////
  // METHODS FOR DESERIALIZING VALUES INTO IN-MEMORY CLASSES
  ///////////////////

  /**
   * Parses an XML string into a JS class
   */
  static parseXmlString<T>(str: string, objectType: any): T {
    const containerXmlDoc = new DOMParser().parseFromString(str, 'utf-8');
    return XML.deserialize<T>(containerXmlDoc, objectType);
  }

  /**
   * Parses an XML string into an OPF class, resolving edge cases on the way.
   */
  static async parseOpf(str: string): Promise<OPF> {
    const fixed = Epub.fixOpfString(str);
    const opf = Epub.parseXmlString<OPF>(fixed, OPF);
    return opf;
  }

  /**
   * This code was found in the r2-shared-js repo. I'm not sure if
   * it's necessary, but it seems to fix an edge case of how the package
   * is defined in the XML.
   */
  static fixOpfString(opfStr: string): string {
    const iStart = opfStr.indexOf('<package');
    if (iStart >= 0) {
      const iEnd = opfStr.indexOf('>', iStart);
      if (iEnd > iStart) {
        const clip = opfStr.substr(iStart, iEnd - iStart);
        if (clip.indexOf('xmlns') < 0) {
          return opfStr.replace(
            /<package/,
            '<package xmlns="http://openebook.org/namespaces/oeb-package/1.0/" '
          );
        }
      }
    }
    return opfStr;
  }

  /**
   * Parse a xml string into a Container class.
   */
  static parseContainer(str: string): Container {
    const container = Epub.parseXmlString<Container>(str, Container);
    return container;
  }

  /**
   * Extract the OPF path from a Container
   */
  static getOpfPath(container: Container): string {
    // get the content.opf file from the container.xml file
    const rootfilePath = container.Rootfile[0]?.PathDecoded;
    if (!rootfilePath) {
      throw new Error('container.xml file is missing rootfile path.');
    }
    return rootfilePath;
  }

  /**
   * As best I can tell, the TOC.ncx file is always referenced with
   * an <item> in the <manifest> with id === 'ncx'
   */
  static getNcxHref(opf: OPF) {
    const manifest = opf.Manifest.find(
      (item) => item.MediaType === Epub.NCX_MEDIA_TYPE
    );
    return manifest?.HrefDecoded;
  }

  /**
   * Parses an NCX XML string into a TOC Document
   */
  static parseNcx(ncxStr: string | undefined) {
    return ncxStr ? Epub.parseXmlString<NCX>(ncxStr, NCX) : undefined;
  }

  /**
   * Convert the relative href relative to the opfPath, that's the OEBPS or ops folder
   * This is to keep things consistant and make opfPath the main root folder for contents
   */
  static resolvePathToOpfPath(
    fetcher: Fetcher,
    opfPath: string,
    href: string | undefined
  ) {
    if (!href) return undefined;

    return fetcher.resolveRelativePath(opfPath, href);
  }

  static getNavDocHref(opf: OPF): string | undefined {
    const navDocItem = opf.Manifest.find((item) =>
      Epub.parseSpaceSeparatedString(item.Properties).includes('nav')
    );
    return navDocItem?.HrefDecoded;
  }

  static parseNavDoc(navDocStr: string | undefined) {
    return navDocStr ? new DOMParser().parseFromString(navDocStr) : undefined;
  }

  static parseEncryptionDoc(encryptionStr: string | undefined) {
    return encryptionStr
      ? Epub.parseXmlString<Encryption>(encryptionStr, Encryption)
      : undefined;
  }

  /**
   * Parses a space separated string of properties into an array
   */
  static parseSpaceSeparatedString(str: string | undefined | null): string[] {
    return (
      str
        ?.trim()
        .split(' ')
        .map((role) => role.trim())
        .filter((role) => role.length > 0) ?? []
    );
  }

  /**
   * Takes a maybe file and a maybe decryptor and returns
   * a decrypted string.
   */
  static async decryptStr(
    buffer: ArrayBuffer | undefined,
    decryptor: Decryptor | undefined
  ): Promise<string | undefined> {
    if (!buffer) return undefined;
    if (!decryptor) return new TextDecoder('utf-8').decode(buffer);
    return await decryptor.decryptAsStr(new Uint8Array(buffer));
  }

  /**
   * Decrypts an ArrayBuffer and returns a decrypted Uint8Array
   */
  static async decryptAb(
    buffer: ArrayBuffer,
    decryptor: Decryptor | undefined
  ): Promise<ArrayBuffer> {
    if (!decryptor) return buffer;
    return await decryptor.decrypt(new Uint8Array(buffer));
  }

  getLinkEncryption(relativePath: string) {
    return getEncryptionInfo(this.encryptionDoc, relativePath, this.isAxisNow);
  }

  ///////////////////
  // METHODS FOR GETTING VALUES FROM THE TOC AND NCX FILES
  ///////////////////

  /**
   * Extracts a named metadata property from either epub.opf.Metatada.DCMetadata
   * or epub.opf.Metadata, if the prior doesn't exist. Returns undefined
   * in case of failure. This is to support EPUB 2.0, which allows
   * metadata to be nested within dc:metadata:
   * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.2
   */
  extractMetadataMember<T extends keyof DCMetadata>(key: T) {
    return this.opf.Metadata?.DCMetadata?.[key] ?? this.opf.Metadata[key];
  }

  /**
   * Extracts meta fields that are found in the XMetadata or Meta arrays
   * within the Metadata object. This is necessary because EPUB allows metadata
   * to be nested under either tag.
   */
  extractMetaField(filter: (meta: Metafield) => boolean) {
    /**
     * These properties are not marked as optional, but that is a mistake, they
     * are indeed optional and need to use optional chaining and nullish coalescing
     */
    const xMetaFields =
      this.opf.Metadata?.XMetadata?.Meta?.filter(filter) ?? [];
    const metaFields = this.opf.Metadata?.Meta?.filter(filter) ?? [];

    return [...xMetaFields, ...metaFields];
  }
}

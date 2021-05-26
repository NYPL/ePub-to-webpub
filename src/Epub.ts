import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import { DCMetadata } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-dc-metadata';
import { Metafield } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-metafield';
import { XML } from 'r2-utils-js/dist/es8-es2017/src/_utils/xml-js-mapper';
import { DOMParser } from 'xmldom';
import { EpubVersion } from './types';
import { Rootfile } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container-rootfile';

/**
 * This class represents a complete EPUB. It is abstract
 * because it is meant to be subclassed to support various
 * ways an EPUB can be sourced:
 *  - Local (filesystem) exploded EPUB
 *  - Local packaged EPUB
 *  - Remote (external server) exploded EPUB
 *  - Remote packaged EPUB
 *
 * For each of these cases we should only need to implement
 * the following functions:
 *  - build
 *  - getFileStr
 *  - getFullHref
 * Then, the consumer (in this case construct-manifest) doesn't
 * need to worry about how to source the contents, that's abstracted
 * away. It just uses the properties and methods on the Epub class
 * to build the manifest.
 *
 * This class includes utilites used to parse the string file values
 * into in-memory representations and to extract values from the various
 * data structures. They will be used by all subclasses.
 */
export default abstract class Epub {
  static NCX_MEDIA_TYPE = 'application/x-dtbncx+xml';
  static CONTAINER_PATH = 'META-INF/container.xml';

  constructor(
    private readonly containerXmlPath: string,
    public readonly folderPath: string,
    public readonly container: Container,
    public readonly opf: OPF,
    // EPUB 2 uses NCX, EPUB 3 uses NavDoc
    public readonly ncx: NCX | undefined,
    public readonly navDoc: Document | undefined
  ) {}

  public static async build(containerXmlPath: string): Promise<Epub> {
    throw new Error(
      'The `build` method must be overrridden by the concrete class extending Epub.'
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

  ///////////////////
  // ABSTRACT METHODS THAT DIFFER BY SUBCLASS
  ///////////////////

  // returns an href relative to the folder root given one relative to the content
  // directory (ie from OEBPS or OPS)
  abstract getRelativeHref(path: string): string;
  // returns the absolute href to get the file, whether a remote url or a filesystem path
  abstract getAbsoluteHref(path: string): string;
  abstract getFileStr(path: string): Promise<string>;

  ///////////////////
  // METHODS FOR DESERIALIZING STRINGS INTO IN-MEMORY CLASSES
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
   * an <item> in the <manifest> with id === 'ncx
   */
  static getNcxHref(opf: OPF) {
    return opf.Manifest.find(
      item => item.ID === 'ncx' && item.MediaType === Epub.NCX_MEDIA_TYPE
    )?.HrefDecoded;
  }

  /**
   * Parses an NCX XML string into a TOC Document
   */
  static parseNcx(ncxStr: string | undefined) {
    return ncxStr ? Epub.parseXmlString<NCX>(ncxStr, NCX) : undefined;
  }

  static getNavDocHref(opf: OPF): string | undefined {
    const navDocItem = opf.Manifest.find(item =>
      Epub.parseSpaceSeparatedString(item.Properties).includes('nav')
    );
    return navDocItem?.HrefDecoded;
  }

  static parseNavDoc(navDocStr: string | undefined) {
    return navDocStr ? new DOMParser().parseFromString(navDocStr) : undefined;
  }

  /**
   * Parses a space separated string of properties into an array
   */
  static parseSpaceSeparatedString(str: string | undefined | null): string[] {
    return (
      str
        ?.trim()
        .split(' ')
        .map(role => role.trim())
        .filter(role => role.length > 0) ?? []
    );
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

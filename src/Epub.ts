import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import { DCMetadata } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-dc-metadata';
import { Metafield } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-metafield';
import { XML } from 'r2-utils-js/dist/es8-es2017/src/_utils/xml-js-mapper';
import { DOMParser } from 'xmldom';

export default abstract class Epub {
  static NCX_MEDIA_TYPE = 'application/x-dtbncx+xml';

  constructor(
    private readonly containerXmlPath: string,
    public readonly folderPath: string,
    public readonly container: Container,
    public readonly opf: OPF,
    public readonly ncx: NCX | undefined
  ) {}

  public static async build(containerXmlPath: string): Promise<Epub> {
    throw new Error(
      'The `build` method must be overrridden by the concrete class extending Epub.'
    );
  }

  ///////////////////
  // ABSTRACT METHODS THAT DIFFER BY SUBCLASS
  ///////////////////

  abstract getFullHref(path: string): string;
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

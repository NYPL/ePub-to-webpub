/**
 * This file is all about decoding strings into in-memory
 * JS structures, usually custom classes from XML
 */
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { DOMParser } from 'xmldom';
import { XML } from 'r2-utils-js/dist/es8-es2017/src/_utils/xml-js-mapper';
import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';

/**
 * Parses and decodes an XML string into a JS class
 */
export function parseXmlString<T>(str: string, objectType: any): T {
  const containerXmlDoc = new DOMParser().parseFromString(str);
  return XML.deserialize<T>(containerXmlDoc, objectType);
}

export async function decodeOpf(str: string): Promise<OPF> {
  const fixed = fixOpfString(str);
  const opf = parseXmlString<OPF>(fixed, OPF);
  return opf;
}

/**
 * Fix some edge case that was found in the r2-shared-js repo...
 */
function fixOpfString(opfStr: string): string {
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

export function decodeContainer(str: string): Container {
  const container = parseXmlString<Container>(str, Container);
  return container;
}

export function getOpfPath(container: Container): string {
  // get the content.opf file from the container.xml file
  const rootfilePath = container.Rootfile[0]?.PathDecoded;
  if (!rootfilePath) {
    throw new Error('container.xml file is missing rootfile path.');
  }
  return rootfilePath;
}

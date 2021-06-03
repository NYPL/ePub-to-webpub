import Epub from '../Epub';
import { ReadiumLink } from '../WebpubManifestTypes/ReadiumLink';
import xpath from 'xpath';
import { DOMParser } from 'xmldom';

/**
 * This file is for converting an EPUB 3 Navigation Document into a
 * Readium TOC represented by a nested list of ReadiumLink's.
 */

// used for extracting things from the NavDoc
const select = xpath.useNamespaces({
  epub: 'http://www.idpf.org/2007/ops',
  xhtml: 'http://www.w3.org/1999/xhtml',
});

/**
 * EPUB 3s embed the TOC information in a Nav Document,
 * whereas EPUB 2s put that info in the NCX file. This function
 * extracts TOC information for the manifest from the Nav Document
 */
export function extractTocFromNavDoc(epub: Epub): ReadiumLink[] {
  const { navDoc } = epub;

  // we only care about the toc nav currently. In the future we can
  // parse the other navs, like PageList
  const tocListItems = select(
    "/xhtml:html/xhtml:body//xhtml:nav[@*[name()='epub:type'] = 'toc']/xhtml:ol/xhtml:li",
    navDoc
  ) as Element[]; //?

  const toc = tocListItems.map(listItemToLink(epub));
  return toc;
}

/**
 * Converts a NavDoc ListItem to a ReadiumLink. A List Item might have its title
 * and href defined in a child <a> tag, but if it contains children, it also can
 * contain a <span> in place of the <a> tag indicating it doesn't have an href itself,
 * only a title and children. This is invalid in Readium, so we hoist the href of
 * the first child to be the href of the parent as well.
 */
export const listItemToLink =
  (epub: Epub) =>
  (listItem: Element): ReadiumLink => {
    const doc = new DOMParser().parseFromString(listItem.toString(), 'utf-8');
    const spanTitle = select('string(/xhtml:li/xhtml:span)', doc, true); //?
    const anchorTitle = select('string(/xhtml:li/xhtml:a)', doc, true); //?
    const href = select('string(/xhtml:li/xhtml:a/@href)', doc); //?

    const childElements = select('/xhtml:li/xhtml:ol/xhtml:li', doc) as
      | Element[]
      | undefined;
    const children = childElements?.map(listItemToLink(epub));

    // if it has a spanTitle then it doesn't have a child <a> tag, and
    // we have to get the href from the children.
    if (typeof spanTitle === 'string' && spanTitle.length > 0) {
      if (!children?.[0]) {
        throw new Error('TOC List Item with <span> is missing children.');
      }
      const firstChildHref = children?.[0].href;
      const link: ReadiumLink = {
        href: firstChildHref,
        title: spanTitle,
      };
      // add children if there are any
      if (children && children.length > 0) link.children = children;
      return link;
    }

    // otherwise we are dealing with a standard element with an <a> tag within.
    if (typeof anchorTitle !== 'string' || anchorTitle.length < 1) {
      throw new Error(`TOC List item missing title: ${listItem.toString()}`);
    }
    if (typeof href !== 'string') {
      throw new Error(`TOC List item missing href: ${listItem.toString()}`);
    }
    const relativePath = epub.fetcher.resolveRelativePath(epub.opfPath, href);
    const link: ReadiumLink = {
      title: anchorTitle,
      href: relativePath,
    };
    // add children if there are any
    if (children && children.length > 0) link.children = children;
    return link;
  };

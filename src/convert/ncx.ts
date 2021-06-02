import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';
import { NavPoint } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx-navpoint';
import Epub from '../Epub';
import { ReadiumLink } from '../WebpubManifestTypes/ReadiumLink';

/**
 * NCX files are used by EPUB 2 books to define the
 * TOC. The spec is here:
 * http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1
 */
export function extractTocFromNcx(epub: Epub, ncx: NCX): ReadiumLink[] {
  const points = ncx.Points;

  const toc = points.map(navPointToLink(epub));

  return toc;
}

/**
 * Turns a NavPoint from an NCX file into a ReadiumLink.
 */
export const navPointToLink =
  (epub: Epub) =>
  (point: NavPoint): ReadiumLink => {
    const href = point.Content.SrcDecoded;
    if (!href) {
      throw new Error(`NavPoint missing href: ${point}`);
    }
    const link: ReadiumLink = {
      title: point.NavLabel.Text,
      href: epub.getRelativeHref(href),
    };

    // we cast this to make the type wider because it's wrong in r2-shared-js.
    // it actually can be undefined.
    const childPoints = point.Points as NavPoint[] | undefined;
    // recurse on the children points
    if (childPoints && childPoints.length > 0) {
      const children = childPoints.map(navPointToLink(epub)).filter(isLink);
      link.children = children;
    }
    return link;
  };

// useful for typescript to use in a filter
function isLink(val: ReadiumLink | undefined): val is ReadiumLink {
  return !!val;
}

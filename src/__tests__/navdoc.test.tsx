import { DOMParser } from 'xmldom';
import xpath from 'xpath';
import { listItemToLink } from '../convert/navdoc';
import Epub from '../Epub';

const tocNav = `
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <nav epub:type="lot">
    <h2>List of tables, broken down into individual groups, one per major section of the publication content
    </h2>
    <ol>
      <li>
        <span>Tables in Chapter 1</span>
        <ol>
          <li>
            <a href="chap1.xhtml#table-1.1">Table 1.1</a>
          </li>
          <li>
            <a href="chap1.xhtml#table-1.2">Table 1.2</a>
          </li>
        </ol>
      </li>
      <li>
        <span>Tables in Chapter 2</span>
        <ol>
          <li>
            <a href="chap2.xhtml#table-2.1">Table 2.1</a>
          </li>
          <li>
            <a href="chap2.xhtml#table-2.2">Table 2.2</a>
          </li>
          <li>
            <a href="chap2.xhtml#table-2.3">Table 2.3</a>
          </li>
        </ol>
      </li>
      <li>
        <span>Tables in Appendix</span>
        <ol>
          <li>
            <a href="appendix.xhtml#table-a.1">Table A.1</a>
          </li>
          <li>
            <a href="appendix.xhtml#table-a.2">Table B.2</a>
          </li>
        </ol>
      </li>
    </ol>
  </nav>
</html>
`;

const select = xpath.useNamespaces({
  epub: 'http://www.idpf.org/2007/ops',
  xhtml: 'http://www.w3.org/1999/xhtml',
});

function strToDoc(str: string): Document {
  return new DOMParser().parseFromString(str, 'utf-8');
}

function strToLi(str: string): Element {
  const doc = strToDoc(str);
  return select('/xhtml:html/xhtml:li', doc, true) as Element;
}

describe('listItemToLink', () => {
  const listItemWithoutSpan = strToLi(`
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
    <li>
      <a href="parent-href">Parent</a>
      <ol>
        <li>
          <a href="child-1-href">Child 1</a>
        </li>
        <li>
          <a href="child-2-href">Child 2</a>
        </li>
      </ol>
    </li> 
  </html>
  `);

  const listItemWithSpan = strToLi(`
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
    <li>
      <span>Parent Heading</span>
      <ol>
        <li>
          <a href="child-1-href">Child 1</a>
        </li>
        <li>
          <a href="child-2-href">Child 2</a>
        </li>
      </ol>
    </li> 
  </html>
  `);

  const basicListItem = strToLi(`
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
    <li>
      <a href="basic-href">Basic Title</a>
    </li>
  </html>
  `);

  const epub = {
    contentPath: 'OPS/',
    fetcher: {
      resolveRelativePath: (from: string, to: string) => {
        return `OPS/${to}`;
      },
      resolveHref: (from: string, to: string, relative: boolean = true) => {
        return relative ? `OPS/${to}` : `https://domain.com/OPS/${to}`;
      },
    },
  } as Epub;

  it('extracts link from basic list item', () => {
    expect(listItemToLink(epub)(basicListItem)).toEqual({
      title: 'Basic Title',
      href: 'OPS/basic-href',
    });
  });

  it('extracts absolute link from basic list item', () => {
    expect(
      listItemToLink({ ...epub, useRelativeHrefs: false } as Epub)(
        basicListItem
      )
    ).toEqual({
      title: 'Basic Title',
      href: 'https://domain.com/OPS/basic-href',
    });
  });

  it('extracts link from nested list item', () => {
    expect(listItemToLink(epub)(listItemWithoutSpan)).toEqual({
      title: 'Parent',
      href: 'OPS/parent-href',
      children: [
        { title: 'Child 1', href: 'OPS/child-1-href' },
        { title: 'Child 2', href: 'OPS/child-2-href' },
      ],
    });
  });

  it('extracts absolute link from nested list item', () => {
    expect(
      listItemToLink({ ...epub, useRelativeHrefs: false } as Epub)(
        listItemWithoutSpan
      )
    ).toEqual({
      title: 'Parent',
      href: 'https://domain.com/OPS/parent-href',
      children: [
        { title: 'Child 1', href: 'https://domain.com/OPS/child-1-href' },
        { title: 'Child 2', href: 'https://domain.com/OPS/child-2-href' },
      ],
    });
  });

  it('extracts link from list item with <span> instead of <a>', () => {
    expect(listItemToLink(epub)(listItemWithSpan)).toEqual({
      title: 'Parent Heading',
      href: 'OPS/child-1-href',
      children: [
        { title: 'Child 1', href: 'OPS/child-1-href' },
        { title: 'Child 2', href: 'OPS/child-2-href' },
      ],
    });
  });
});

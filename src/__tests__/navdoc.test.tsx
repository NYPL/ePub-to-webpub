import { DOMParser } from 'xmldom';
import xpath from 'xpath';
import { listItemToLink } from '../construct-manifest';

const tocNav = `
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
  return xpath.select1('/li', doc) as Element;
}

describe('listItemToLink', () => {
  const listItemWithoutSpan = strToLi(`
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
  `);

  const listItemWithSpan = strToLi(`
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
  `);

  const basicListItem = strToLi(`
  <li>
    <a href="basic-href">Basic Title</a>
  </li>
  `);

  function getRelativeHref(relative: string) {
    return `OPS/${relative}`;
  }

  it('extracts link from basic list item', () => {
    expect(listItemToLink(getRelativeHref)(basicListItem)).toEqual({
      title: 'Basic Title',
      href: 'OPS/basic-href',
    });
  });

  it('extracts link from nested list item', () => {
    expect(listItemToLink(getRelativeHref)(listItemWithoutSpan)).toEqual({
      title: 'Parent',
      href: 'OPS/parent-href',
      children: [
        { title: 'Child 1', href: 'OPS/child-1-href' },
        { title: 'Child 2', href: 'OPS/child-2-href' },
      ],
    });
  });

  it('extracts link from list item with <span> instead of <a>', () => {
    expect(listItemToLink(getRelativeHref)(listItemWithSpan)).toEqual({
      title: 'Parent Heading',
      href: 'OPS/child-1-href',
      children: [
        { title: 'Child 1', href: 'OPS/child-1-href' },
        { title: 'Child 2', href: 'OPS/child-2-href' },
      ],
    });
  });
});

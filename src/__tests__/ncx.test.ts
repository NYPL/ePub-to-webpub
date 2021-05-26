import { navPointToLink } from '../construct-manifest';
import xpath from 'xpath';
import { DOMParser } from 'xmldom';

describe('NCX Deserializer', () => {
  const navPoint = `
  <navPoint id="np-1" playOrder="1">
    <navLabel>
      <text>Moby Dick</text>
    </navLabel>
    <content src="@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00000"/>
    <navPoint>
      <navLabel>
        <text>Child 1</text>
      </navLabel>
      <content src="/child-1" />
    </navPoint>
    <navPoint>
      <navLabel>
        <text>Child 2</text>
      </navLabel>
      <content src="/child-2" />
      <navPoint>
        <navLabel>
          <text>Child 21</text>
        </navLabel>
        <content src="/child-21" />
      </navPoint> 
    </navPoint>
  </navPoint>
`;

  it('creates link from navPoint', () => {
    const link = navPointToLink(navPoint);
    expect(link).toEqual({
      title: 'Moby Dick',
      href:
        '@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00000',
      children: [
        { title: 'Child 1', href: '/child-1' },
        {
          title: 'Child 2',
          href: '/child-2',
          children: [{ title: 'Child 21', href: '/child-21' }],
        },
      ],
    });
  });

  it('ignores unexpected xml', () => {
    const navPoint = `
    <navPoint id="np-1" playOrder="1">
      <navLabel>
        <text>Moby Dick</text>
      </navLabel>
      <content src="@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00000"/>
      <navPoint>
        <hey>whatup</hey>
        <navLabel>
          <text>Child 1</text>
          <hey2>whatup</hey2>
        </navLabel>
        <content src="/child-1" />
      </navPoint>
      <navPoint>
        <navLabel>
          <text>Child 2</text>
        </navLabel>
        <content src="/child-2" />
      </navPoint>
    </navPoint>
  `;
    const link = navPointToLink(navPoint);
    expect(link).toEqual({
      title: 'Moby Dick',
      href:
        '@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00000',
      children: [
        { title: 'Child 1', href: '/child-1' },
        {
          title: 'Child 2',
          href: '/child-2',
        },
      ],
    });
  });

  const strToDoc = (xml: string) => new DOMParser().parseFromString(xml);

  /**
   * we want to first query the name of the top level navPoint,
   * then use the navPoint/navPoint query to get the children which are
   * navPoints, and query the name of the inner navPoint there.
   */
  it('xpath queries using correct context', () => {
    const navPointDoc = strToDoc(navPoint);
    const labelNode = xpath.select(
      'navPoint/navLabel/text/text()',
      navPointDoc,
      true
    ) as Node;
    const label = labelNode.nodeValue;
    // we can successfully get the top level label
    expect(label).toBe('Moby Dick');

    // then we would recurse through the children navPoints, but
    // in this case we will just take a single one to show how it doesn't
    // work.
    const children = xpath.select('navPoint/navPoint', navPointDoc);
    // we have to case because the xpath library types are not great.
    // should be a node though it if finds anything, which in this case it does
    // find the right node.
    const child1 = children[0] as Node;
    const child1NewDoc = strToDoc(child1.toString());
    // try to select the label using child1 as the context, but it will alwaus
    // return undefined.
    const childLabelNode = xpath.select(
      'navPoint/navLabel/text/text()',
      child1, // child1NewDoc works here, but child1 doesn't
      true
    ) as Node;
    // it will fail here because childLabelNode is undefined
    const childLabel = childLabelNode.nodeValue;

    expect(childLabel).toBe('Child 1');
  });
});

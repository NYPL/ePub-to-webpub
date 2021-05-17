import { navPointToLink } from '../construct-manifest';
import { ncxString } from './ncxStub';

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
});

const mobyEpub3Manifest = {
  '@context': 'https://readium.org/webpub-manifest/context.jsonld',
  metadata: {
    '@type': 'http://schema.org/Book',
    title: 'Moby-Dick',
    identifier: 'code.google.com.epub-samples.moby-dick-basic',
    author: {
      name: 'Herman Melville',
      sortAs: 'MELVILLE, HERMAN',
    },
  },
  readingOrder: [
    {
      type: 'application/xhtml+xml',
      href: 'OPS/subdir/1902/chapter_001.xhtml',
    },
  ],
  resources: [],
  toc: [
    {
      title: 'Chapter 1. Loomings.',
      href: 'OPS/subdir/1902/chapter_001.xhtml',
    },
  ],
};

export default mobyEpub3Manifest;

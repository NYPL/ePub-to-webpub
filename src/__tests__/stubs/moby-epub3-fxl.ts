const mobyEpub3FXLManifest = {
  '@context': 'https://readium.org/webpub-manifest/context.jsonld',
  metadata: {
    '@type': 'http://schema.org/Book',
    title: 'Moby-Dick',
    identifier: 'code.google.com.epub-samples.moby-dick-basic',
    author: {
      name: 'Herman Melville',
      sortAs: 'MELVILLE, HERMAN',
    },
    contributor: {
      name: 'Dave Cramer',
      role: 'mrk',
    },
    publisher: 'Harper & Brothers, Publishers',
    language: 'en-US',
    modified: '2021-05-03T09:00:00.706Z',
    presentation: {
      layout: 'fixed',
    },
  },
  readingOrder: [
    {
      type: 'application/xhtml+xml',
      href: 'OPS/chapter_001.xhtml',
    },
    {
      type: 'application/xhtml+xml',
      href: 'OPS/toc.xhtml',
      rel: 'contents',
    },
  ],
  resources: [
    {
      type: 'application/vnd.ms-opentype',
      href: 'OPS/fonts/STIXGeneral.otf',
    },
  ],
  toc: [
    {
      title: 'Chapter 1. Loomings.',
      href: 'OPS/chapter_001.xhtml',
    },
  ],
};

export default mobyEpub3FXLManifest;

const mobyEpub2Manifest = {
  '@context': 'https://readium.org/webpub-manifest/context.jsonld',
  metadata: {
    '@type': 'http://schema.org/Book',
    title: 'Moby Dick; Or, The Whale',
    identifier: 'http://www.gutenberg.org/2701',
    author: 'Herman Melville',
    language: 'en',
    modified: 'Mon May 10 2021 12:15:05 GMT-0700 (Pacific Daylight Time)',
    rights: 'Public domain in the USA.',
    source: 'https://www.gutenberg.org/files/2701/2701-h/2701-h.htm',
    subject: [
      'Whaling -- Fiction',
      'Sea stories',
      'Psychological fiction',
      'Ship captains -- Fiction',
      'Adventure stories',
      'Mentally ill -- Fiction',
      'Ahab, Captain (Fictitious character) -- Fiction',
      'Whales -- Fiction',
      'Whaling ships -- Fiction',
    ],
    cover: 'item1',
  },
  readingOrder: [
    {
      type: 'application/xhtml+xml',
      href: 'OEBPS/subdir/1900/@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html',
    },
  ],
  resources: [
    {
      type: 'image/png',
      height: 1800,
      width: 1200,
      rel: 'cover',
      href: 'OEBPS/@export@sunsite@users@gutenbackend@cache@epub@2701@2701-cover.png',
    },
    {
      href: 'OEBPS/subdir/1900/toc.ncx',
      type: 'application/x-dtbncx+xml',
      id: 'ncx',
    },
    {
      href: 'OEBPS/wrap0000.html',
      type: 'application/xhtml+xml',
      id: 'coverpage-wrapper',
    },
  ],
  toc: [
    {
      title: 'MOBY-DICK; or, THE WHALE.',
      href: 'OEBPS/subdir/1900/@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00000',
    },
    {
      title: 'Original Transcriber’s Notes:',
      href: 'OEBPS/subdir/1900/@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00001',
    },
    {
      title: 'ETYMOLOGY.',
      children: [
        {
          title: '(Supplied by a Late Consumptive Usher to a Grammar School.)',
          href: 'OEBPS/subdir/1900/@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00003',
        },
      ],
      href: 'OEBPS/subdir/1900/@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00002',
    },
    {
      title: 'EXTRACTS. (Supplied by a Sub-Sub-Librarian).',
      children: [
        {
          title: 'EXTRACTS.',
          href: 'OEBPS/subdir/1900/@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00005',
        },
      ],
      href: 'OEBPS/subdir/1900/@public@vhost@g@gutenberg@html@files@2701@2701-h@2701-h-0.htm.html#pgepubid00004',
    },
  ],
  landmarks: [
    {
      title: 'Cover',
      href: 'OEBPS/wrap0000.html',
    },
  ],
};

export default mobyEpub2Manifest;

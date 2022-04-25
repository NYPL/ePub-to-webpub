// a webpub pdf collection
export const WebpubPdfConformsTo = 'stub/webpub+pdf';
// Epub profiles
export const EpubConformsTo =
  'https://readium.org/webpub-manifest/profiles/epub';

export type ConformsTo = typeof WebpubPdfConformsTo | typeof EpubConformsTo;

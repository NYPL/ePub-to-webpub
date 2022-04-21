// a webpub pdf collection
export const WebpubPdfConformsTo = 'stub/webpub+pdf';
// a webpub of axisnow content
export const AxisNowEpubConformsTo = 'stub/webpub+axisnow';
// Epub profiles
export const EpubConformsTo =
  'https://readium.org/webpub-manifest/profiles/epub';

export type ConformsTo =
  | typeof WebpubPdfConformsTo
  | typeof AxisNowEpubConformsTo
  | typeof EpubConformsTo;

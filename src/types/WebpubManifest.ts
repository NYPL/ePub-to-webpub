/**
 * Type definitions for a manifest
 */

import { Metadata } from './metadata';
import { ReadiumLink } from './ReadiumLink';

export const ReadiumWebpubContext = 'http://readium.org/webpub/default.jsonld';

export interface WebpubManifest {
  '@context'?: typeof ReadiumWebpubContext;
  metadata: Metadata;
  links: ReadiumLink[];
  readingOrder: ReadiumLink[];
  resources?: ReadiumLink[];
  toc?: ReadiumLink[];
}

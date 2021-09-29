#!/usr/bin/env node

import sade from 'sade';
import epubToManifestCLI from './epub-to-webpub';
const pkg = require('../../package.json');

sade('epub-to-webpub <path> <dest>', true)
  .version(pkg.version)
  .describe(
    'Convert a local or remote exploded EPUB to a WebpubManifest JSON file.'
  )
  .example('./moby-dick/META-INF/container.xml ./outputs/manifest.json')
  .option('--axisnow', 'Override encryption scheme with custom AxisNow value')
  .action(epubToManifestCLI)
  .parse(process.argv);

#!/usr/bin/env node

import sade from 'sade';
import chalk from 'chalk';
import ora from 'ora';
import { LocalExplodedEpub } from '..';
import logError from './logError';
import fs from 'fs/promises';
import prettier from 'prettier';
import Epub from '../Epub';
import RemoteExplodedEpub from '../RemoteExplodedEpub';
const pkg = require('../../package.json');

sade('epub-to-webpub <path> <dest>', true)
  .version(pkg.version)
  .describe('Convert a local, exploded EPUB to a WebpubManifest JSON file.')
  .example('./moby-dick/META-INF/container.xml ./outputs/manifest.json')
  .action(async (path: string, dest: string) => {
    console.log(
      chalk.blue(
        `
###########################
NYPL Epub to Webpub Converter
###########################
`
      )
    );
    const spinner = ora('Determining EPUB Type');
    spinner.start();
    const epubClass = getEpubClass(path);
    spinner.succeed(`Detected type: ${chalk.blue(epubClass.description)}`);
    try {
      spinner.start(`Reading EPUB from: ${chalk.blue(path)}`);
      const epub = await epubClass.build(path);
      spinner.succeed();
      spinner.start('Converting to Webpub');
      const manifest = await epub.webpubManifest;
      spinner.succeed();
      spinner.start('Formatting manifest...');
      const formatted = prettier.format(JSON.stringify(manifest), {
        parser: 'json',
      });
      spinner.succeed();
      spinner.start(`Writing Manifest to filesystem at: ${chalk.blue(dest)}`);
      await fs.writeFile(dest, formatted);
      spinner.succeed();
    } catch (e) {
      spinner.fail('Failed to convert EPUB');
      logError(e);
      process.exit(1);
    }
  })
  .parse(process.argv);

function getEpubClass(path: string): {
  build: (containerXmlPath: string) => Promise<Epub>;
  description: string;
} {
  const remote = isRemote(path);
  const exploded = isExploded(path);
  // remote exploded
  if (remote && exploded) return RemoteExplodedEpub;
  // local exploded
  if (!remote && exploded) return LocalExplodedEpub;
  // remote or local packaged
  throw new Error('Packaged EPUBS not yet supported');
}

function isRemote(path: string) {
  return path.startsWith('http://') || path.startsWith('https://');
}
function isExploded(path: string) {
  return path.endsWith('.xml');
}

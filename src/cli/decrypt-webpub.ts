#!/usr/bin/env node

import fs from 'fs';
import https from 'https';
import path from 'path';
import { ReadiumLink } from '../WebpubManifestTypes/ReadiumLink';
import { WebpubManifest } from '../WebpubManifestTypes/WebpubManifest';
import chalk from 'chalk';
import sade from 'sade';
import ora from 'ora';
import type Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
const pkg = require('../../package.json');
import fetch from 'node-fetch';

const log = (info: string, arg?: string) =>
  `${chalk.bold(info)}${arg ? chalk.blue(arg) : ''}`;

sade('decrypt-webpub <manifest> <dest> <book_vault_uuid> <isbn>', true)
  .version(pkg.version)
  .describe('Fully decrypt a local webpub with the AxisNow decryptor.')
  .example(
    './outputs/axisnow.json outputs/dickens-axisnow/encrypted 9FD5E27H-73C8-4156-A623-FCDF66020BF9 9781682280652'
  )
  .action(
    async (
      manifestPath: string,
      destination: string,
      book_vault_uuid: string,
      isbn: string
    ) => {
      console.log(
        chalk.red(
          `
  ███╗   ██╗██╗   ██╗██████╗ ██╗     
  ████╗  ██║╚██╗ ██╔╝██╔══██╗██║     
  ██╔██╗ ██║ ╚████╔╝ ██████╔╝██║     
  ██║╚██╗██║  ╚██╔╝  ██╔═══╝ ██║     
  ██║ ╚████║   ██║   ██║     ███████╗
  ╚═╝  ╚═══╝   ╚═╝   ╚═╝     ╚══════╝
  `,
          chalk.red.bold`
     Webpub Decryptor 
  `
        )
      );
      const spinner = ora('Resolving decryptor package');
      const manifestUrl = path.resolve(manifestPath);
      const output = path.resolve(destination);
      spinner.info(log('Reading manifest from: ', manifestUrl));
      spinner.info(log('Destination folder: ', output));
      spinner.info(log('book_vault_uuid: ', book_vault_uuid));
      spinner.info(log('isbn: ', isbn));
      let decryptor: Decryptor | undefined = undefined;
      try {
        const Decryptor =
          require('@nypl-simplified-packages/axisnow-access-control-web').default;
        decryptor = await Decryptor.createDecryptor({ book_vault_uuid, isbn });
      } catch (e) {
        throw new Error('AxisNow Decryptor package is not available.');
      }
      if (typeof decryptor === 'undefined') {
        throw new Error('Could not instantiate decryptor');
      }

      spinner.start('Decrypting files...');

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const manifest: WebpubManifest = require(manifestUrl);

      // console.log(manifest.readingOrder[0]);

      for (const link of manifest.readingOrder) {
        await decryptLink(link, manifestUrl, decryptor!, output);
      }

      // const resources =
      //   manifest.resources?.map((res) =>
      //     decryptLink(res, manifestUrl, decryptor!, destination)
      //   ) ?? [];

      // const readingOrder = manifest.readingOrder.map((chapt) =>
      //   decryptLink(chapt, manifestUrl, decryptor!, destination)
      // );

      // await Promise.all([...resources, ...readingOrder]);

      spinner.succeed('Done.');
    }
  )
  .parse(process.argv);

async function decryptLink(
  link: ReadiumLink,
  manifestUrl: string,
  decryptor: Decryptor,
  destination: string
) {
  const inPath = path.resolve(path.dirname(manifestUrl), link.href);
  console.log('DECRYPTING', inPath);
  // read the file
  const readFile = await fs.promises.readFile(inPath);

  // decrypt
  const decrypted = await decryptor.decrypt(readFile);
  console.log('DECRYPTED.');
  // write it to the destination
  writeFile(destination, link.href, decrypted);
}

async function writeFile(
  destination: string,
  href: string,
  file: string | Uint8Array
) {
  const dest = path.resolve(__dirname, destination, href);
  await fs.promises.mkdir(path.dirname(dest), {
    recursive: true,
    mode: 0o777,
  });
  await fs.promises.writeFile(dest, file);
  console.log('wrote file to', dest);
}

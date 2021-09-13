#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { ReadiumLink } from '../WebpubManifestTypes/ReadiumLink';
import { WebpubManifest } from '../WebpubManifestTypes/WebpubManifest';
import chalk from 'chalk';
import sade from 'sade';
import ora from 'ora';
import type Decryptor from '@nypl-simplified-packages/axisnow-access-control-web';
import { AxisNowEncryptionScheme } from '../constants';
const pkg = require('../../package.json');

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

      const resources =
        manifest.resources?.map((res) =>
          decryptLink(res, manifestUrl, decryptor!, output)
        ) ?? [];

      const readingOrder = manifest.readingOrder.map((chapt) =>
        decryptLink(chapt, manifestUrl, decryptor!, output)
      );

      await Promise.all([...resources, ...readingOrder]);
      spinner.succeed();

      spinner.start('Writing new manifest.json');

      manifest.readingOrder = manifest.readingOrder.map(
        removeEncryptionProperty
      );
      manifest.resources = manifest.resources?.map(removeEncryptionProperty);

      const json = JSON.stringify(manifest);
      await writeFile(output, 'manifest.json', json);
      spinner.succeed();

      spinner.start('Success!');
      spinner.succeed();
    }
  )
  .parse(process.argv);

/**
 * Removes the link.properties.encrypted key, because the files are now decrypted
 */
function removeEncryptionProperty(link: ReadiumLink): ReadiumLink {
  if (link.properties?.encrypted) {
    return {
      ...link,
      properties: { ...link.properties, encrypted: undefined },
    };
  }
  return link;
}

async function decryptLink(
  link: ReadiumLink,
  manifestUrl: string,
  decryptor: Decryptor,
  destination: string
) {
  const inPath = path.resolve(path.dirname(manifestUrl), link.href);
  // read the file
  const file = await fs.promises.readFile(inPath);

  // only decrypt links that are detected to be AxisNow encrypted
  if (link?.properties?.encrypted?.scheme === AxisNowEncryptionScheme) {
    // decrypt
    const decrypted = await decryptor.decrypt(file);
    // write it to the destination
    await writeFile(destination, link.href, decrypted);
  } else {
    await writeFile(destination, link.href, file);
  }
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
}

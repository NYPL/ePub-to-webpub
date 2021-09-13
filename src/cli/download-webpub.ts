#!/usr/bin/env node

import fs from 'fs';
import https from 'https';
import path from 'path';
import { ReadiumLink } from '../WebpubManifestTypes/ReadiumLink';
import { WebpubManifest } from '../WebpubManifestTypes/WebpubManifest';
import chalk from 'chalk';
import sade from 'sade';
import ora from 'ora';
const pkg = require('../../package.json');

const log = (info: string, arg?: string) =>
  `${chalk.bold(info)}${arg ? chalk.blue(arg) : ''}`;

sade('download-webpub <manifest> <base> <dest>', true)
  .version(pkg.version)
  .describe('Download a remote webpub.')
  .example(
    './outputs/axisnow.json https://node.axisnow.com/content/stream/9781682280652/ outputs/dickens-axisnow/encrypted'
  )
  .action(downloadWebpubCLI)
  .parse(process.argv);

export default async function downloadWebpubCLI(
  manifestPath: string,
  baseUrl: string,
  destination: string,
  book_vault_uuid?: string,
  isbn?: string
) {
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
   Webpub Downloader 
`
    )
  );
  const spinner = ora('Downloading Webpub');
  const manifestUrl = path.resolve(manifestPath);
  const output = path.resolve(destination);
  spinner.info(log('Reading manifest from: ', manifestUrl));
  spinner.info(log('Using Base URL: ', baseUrl));
  spinner.info(log('Destination folder: ', output));

  spinner.start('Downloading files...');
  downloadWebpub(manifestUrl, baseUrl, output).then(() => {
    spinner.succeed(log(`Done.`));
  });
}

async function downloadLink(
  link: ReadiumLink,
  baseUrl: string,
  destination: string
): Promise<void> {
  const url = new URL(link.href, baseUrl);
  const href = url.toString();

  const mainFile = new Promise<void>(async (resolve, reject) => {
    https.get(href, (res) => {
      if (res.statusCode !== 200) {
        throw new Error(
          `Failed to download ${href} . Received ${res.statusCode}`
        );
        reject();
      }
      const pth = path.resolve(__dirname, destination, link.href); //`${destination}${link.href}`;
      fs.promises
        .mkdir(path.dirname(pth), {
          recursive: true,
          mode: 0o777,
        })
        .then(() => {
          const filePath = fs.createWriteStream(pth);
          res.pipe(filePath);

          filePath.on('finish', () => {
            filePath.close();
            resolve();
          });
        });
    });
  });

  // do the children too
  const children =
    link.children?.map((child) => downloadLink(child, baseUrl, destination)) ??
    [];

  await Promise.all<void>([mainFile, ...children]);
}

async function downloadWebpub(
  manifestUrl: string,
  baseUrl: string,
  destination: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const manifest: WebpubManifest = require(manifestUrl);

  const resources =
    manifest.resources?.map((res) => downloadLink(res, baseUrl, destination)) ??
    [];

  const readingOrder = manifest.readingOrder.map((chapt) =>
    downloadLink(chapt, baseUrl, destination)
  );

  await Promise.all([...resources, ...readingOrder]);
}

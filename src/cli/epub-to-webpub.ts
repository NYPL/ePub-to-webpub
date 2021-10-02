import chalk from 'chalk';
import ora from 'ora';
import { LocalFetcher, RemoteFetcher, Epub } from '..';
import { getEpubType } from '../utils';
import prettier from 'prettier';
import fs from 'fs/promises';
import { logError, log } from './log';

export default async function epubToManifestCLI(
  path: string,
  dest: string,
  opts: { axisnow: boolean }
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
 EPUB to Webpub Converter 
`
    )
  );
  const spinner = ora('Determining EPUB Type');
  spinner.start();
  const epubType = getEpubType(path);
  const description =
    epubType === 'local-exploded'
      ? 'Local Exploded EPUB'
      : 'Remote Exploded EPUB';
  spinner.succeed(log('Detected type: ', description));

  try {
    spinner.start(log('Reading EPUB from: ', path));
    const fetcher =
      epubType === 'local-exploded'
        ? new LocalFetcher(path)
        : new RemoteFetcher(path);
    const epub = await Epub.build(path, fetcher, { isAxisNow: opts.axisnow });
    spinner.succeed();
    spinner.start(log('Converting to Webpub...'));
    const manifest = await epub.webpubManifest;
    spinner.succeed();
    spinner.start(log('Formatting manifest...'));
    const formatted = prettier.format(JSON.stringify(manifest), {
      parser: 'json',
    });
    spinner.succeed();
    spinner.start(log('Writing Manifest to filesystem at: ', dest));
    await fs.writeFile(dest, formatted);
    spinner.succeed();
  } catch (e) {
    spinner.fail(log('Failed to convert EPUB'));
    logError(e);
    process.exit(1);
  }
  spinner.start(log('Success!'));
  spinner.succeed();
}

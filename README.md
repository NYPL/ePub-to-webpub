# EPUB to Webpub

This repository is a converter between EPUBS and Webpubs. It can either be deployed as an endpoint service, consumed as a package within another Node service, or used as a CLI. 

## Features

- Exploded EPUB support (packaged EPUBS not currently supported)
- Remote and Local EPUB support
- AxisNow Encrypted EPUB support
- CLI
- Vercel-ready API handlers in `/api`

## CLI Example

```bash
❯ epub-to-webpub ./samples/moby-epub2-exploded/META-INF/container.xml ./outputs/test.json

███╗   ██╗██╗   ██╗██████╗ ██╗     
████╗  ██║╚██╗ ██╔╝██╔══██╗██║     
██╔██╗ ██║ ╚████╔╝ ██████╔╝██║     
██║╚██╗██║  ╚██╔╝  ██╔═══╝ ██║     
██║ ╚████║   ██║   ██║     ███████╗
╚═╝  ╚═══╝   ╚═╝   ╚═╝     ╚══════╝
 
   EPUB to Webpub Converter 

✔ Detected type: Local Exploded Epub
✔ Reading EPUB from: ./samples/moby-epub2-exploded/META-INF/container.xml
✔ Converting to Webpub...
✔ Formatting manifest...
✔ Writing Manifest to filesystem at: ./outputs/test.json
✔ Success!
```

## Deployed API Endpoint

The API endpoints reside in `/api` and are deployed via [Vercel](https://vercel.com) at `https://epub-to-webpub.vercel.app`. The endpoints are:

- **`/api/[containerXmlUrl]`** - You provide the url to the `container.xml` file of an _exploded_ EPUB, and we will return the webpub manifest.
- **`/api/axisnow/[isbn]/[book_vault_uuid]`** - You provide the `isbn` and the `book_vault_uuid`, and we return the webpub manifest.

### Possible Future Features

- Packaged EPUB support.
- Better support for EPUB metadata and other EPUB features.

# Architecture

There are three main pieces to the architecture:
1. **The `Epub` class -** This class serves as the in-memory respresentation of an Epub. It takes in the `container.xml` file and sources all the other files it needs from there.
1. **The `Fetcher` class -** The `Fetcher` is resonsible for sourcing the contents of a file. It allows the `Epub` class to not care how a file is fetched specifically. As such it is an abstract class, and has currently has two concrete implementations: `LocalFetcher` and `RemoteFetcher`. You could support a packaged EPUB by writing a `LocalPackagedFetcher`.
1. **The `/convert` folder -** Here we take in an `Epub` and return a `WebpubManifest` object. This conversion is exposed on the `.webpubManifest` property of an `Epub`. 

## Commands

- `npm run start` - start building the package in watch mode.
- `npm run build` - make a production build of the package. This will export CJS and ESmodules module formats to `/dist`. The cli application will be exported to `/dist/cli`.
- `npm run test` - perform a test run using Jest.
- `npm run test:watch` - perform a test run and re-test on code change.

## Vercel Handlers

CJS, ESModules, and UMD module formats are supported.

The appropriate paths are configured in `package.json` and `dist/index.js` accordingly. Please report if any issues are found.

## Testing

Tests are written with [Jest](https://jestjs.io). There is one particular thing to note here: we use [MSW](https://mswjs.io) (Magic Service Worker) for testing network-based tasks. It intercepts the Node network requests and allows us to serve custom responses. In this case we serve files from the local filesystem in `/samples`, but it also allows us to test other responses a real server might give.
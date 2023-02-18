# THIS REPOSITORY HAS BEEN RELOCATED

This repo has been moved into the [NYPL/ereading-clients](https://github.com/NYPL/ereading-clients/) monorepo under packages/epub-to-webpub.

# EPUB to Webpub

This repository is a converter between EPUBS and Webpubs. It can either be deployed as an endpoint service, consumed as a package within another Node service, or used as a CLI. 

## Features

- Exploded EPUB support (packaged EPUBS not currently supported)
- Remote and Local EPUB support
- AxisNow Encrypted EPUB support
- CLI
- Vercel-ready API handlers in `/api`

## Installation

```bash
npm i @nypl/epub-to-webpub
```

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

## AxisNow Decryption

This repo uses the private github package `@nypl-simplified-packages/axisnow-access-control-web` to decrypt the NCX file in exploded AxisNow EPUBS in order to generate the manifest. If you do not have access to the private github package, you will not be able to deploy this with decryption, and attempting to use the decryption API will throw an error.

### Possible Future Features

- Packaged EPUB support.
- Better support for EPUB metadata and other EPUB features.
- Better cover detection to add `width` and `height` to EPUB 2 cover iamges.

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

## Repo Organization

```txt
/api                 # vercel lambda functions
/mocks               # msw mocks for testing network-dependent code
/samples             # example EPUBS in various formats
/site                # basic index.html file to serve at api root
/src
   /__tests__        
   /cli              # cli entrypoint
   /convert          # generates a Webpub Manifest from an Epub class
   /WebpubManifestTypes   # ...
   Epub.ts           # the main Epub class
   Fetcher.ts        # abstract Fetcher class to be extended by LocalFetcher etc
   index.ts          # entrypoint of the npm module
   LocalFetcher.ts   
   RemoteFetcher.ts
```

## Vercel Handlers

The API endpoints are located in `/api` and deployed to Vercel.

## AWS Lambda Handlers

The converter may be deployed as an AWS Lambda function by using the the handler method in the `/src/lambda.ts` To invoke the method run `npm build` and provide `dist/lambda.handler` as the entrypoint in the Lambda configuration.

## Docker Handler

The API endpoints may also be run as a containerized service. To do so follow these steps:

1) Build the container with `docker build -t epub-to-webpub .`
2) Run the container with `docker run -p 5000:5000 epub-to-webpub`

The API will be available at port 5000 on the container (or whichever port you choose to expose on your host)

## Testing

Tests are written with [Jest](https://jestjs.io). There is one particular thing to note here: we use [MSW](https://mswjs.io) (Magic Service Worker) for testing network-based tasks. It intercepts the Node network requests and allows us to serve custom responses. In this case we serve files from the local filesystem in `/samples`, but it also allows us to test other responses a real server might give.
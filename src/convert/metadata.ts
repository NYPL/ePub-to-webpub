import { Metafield } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf-metafield';
import Epub from '../Epub';
import { Contributors } from '../WebpubManifestTypes/Metadata';
import { WebpubManifest } from '../WebpubManifestTypes/WebpubManifest';

/**
 * For the purposes of this project, the metadata is not _super_ important since
 * these are not being distributed as webpubs, we just need enough info for our
 * reader to display the book correctly.
 *
 * Missing from metadata:
 * - Language Map support for language-based fields
 * - Subtitle extraction
 * - Publication Direction
 * - ...less important stuff defined in the Metadata type
 */
export function extractMetadata(epub: Epub): WebpubManifest['metadata'] {
  const language = epub.extractMetadataMember('Language');
  const title = extractTitle(epub);
  const contributors = extractContributors(epub);
  const identifier = extractIdentifier(epub);

  return {
    title,
    language: language.length > 1 ? language : language[0],
    identifier,
    ...contributors,
  };
}

/**
 * Instead of extracting a map of titles based on language, we will just use
 * the first title we find. This can be extended later to add a
 * map of languages and titles.
 */
function extractTitle(epub: Epub) {
  const titleMeta = epub.extractMetadataMember('Title');
  return titleMeta?.[0].Data ?? 'Uknown Title';
}

/**
 * We will extract a simple list of string contributor names
 * for each contributor role.
 */
function extractContributors(epub: Epub): Contributors {
  const contributorFields = epub.extractMetaField(
    (meta: Metafield) =>
      meta.Property === 'dcterms:creator' ||
      meta.Property === 'dcterms:contributor'
  );

  // Map from EPUB role codes to Webpub Roles
  const roleMap: Record<string, string> = {
    aut: 'author',
    trl: 'translator',
    art: 'artist',
    edt: 'editor',
    ill: 'illustrator',
    ltr: 'letterer',
    pen: 'penciler',
    clr: 'colorist',
    ink: 'inker',
    nrt: 'narrator',
    pbl: 'publisher',
  };

  const contributors = contributorFields.reduce<Contributors>(
    (all, contributor) => {
      const name = contributor.Data;
      // get the role, which is a sibling xml node. The default is contributor
      const epubRole =
        epub.extractMetaField(
          (field) => field.Property === 'role' && field.ID === contributor.ID
        )?.[0]?.Data ?? 'contributor';
      const webpubRole = roleMap[epubRole] ?? 'contributor';
      return {
        ...all,
        [webpubRole]: name,
      };
    },
    {}
  );

  // the author get pre-extracted for some reason from the metafields
  const creators = epub.extractMetadataMember('Creator');
  if (creators.length > 0) {
    if (creators.length > 1) {
      contributors.author = creators.map((creator) => creator.Data);
    } else {
      contributors.author = creators[0].Data;
    }
  }

  return contributors;
}

/**
 * An OPF Package Document can contain many identifiers in its metadata field.
 * However, it also must have a single unique-identifier attribute on the `package`
 * element. This string must be unique to this package document. We will use this.
 *
 * For a spec of OPF <identifier> elements, see:
 *    http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.2.10
 * For a spec of unique-identifier attributes, see:
 *    http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.1
 */
function extractIdentifier(epub: Epub): string {
  return epub.opf.UniqueIdentifier;
}

import { Encryption } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/encryption';
import { AxisNowEncryptionScheme } from '../constants';
import { EPUBExtensionLinkProperties } from '../WebpubManifestTypes/EpubExtension';

/**
 * Adds encryption information to the resource link if there is any detected for this
 * link in the epub.encryptionDoc
 */
export function getEncryptionInfo(
  encryptionDoc: Encryption | undefined,
  relativePath: string,
  isAxisNow: boolean | undefined
) {
  const encryptionData = encryptionDoc?.EncryptedData.find((data) => {
    // Href(relativePath) from the opf.Manifest instance does not give you the full path (Without the subpath OEBPS or OPS),
    // whereas CipherReference.URI has it (e.g. OPS/toc.ncx), so we we have to just check the final patname.
    // http://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.3
    return data.CipherData.CipherReference.URI.endsWith(relativePath);
  });
  const algorithm = encryptionData?.EncryptionMethod.Algorithm;
  let encryption: EPUBExtensionLinkProperties['encrypted'] = undefined;
  const scheme = encryptionData?.KeyInfo.RetrievalMethod.Type;

  /**
   * @TODO - we currently assume the encryption scheme is AxisNow, not supporting
   * any others. We need to figure out how to decipher which scheme this is actually
   * using.
   */
  if (algorithm) {
    if (isAxisNow) {
      encryption = {
        algorithm,
        scheme: AxisNowEncryptionScheme,
      };
    } else {
      encryption = {
        algorithm,
        scheme,
      };
    }
  }

  return encryption;
}

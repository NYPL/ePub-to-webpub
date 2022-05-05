import { Encryption } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/encryption';
import { AxisNowEncryptionScheme } from '../constants';
import { EPUBExtensionLinkProperties } from '../WebpubManifestTypes/EpubExtension';

/**
 * Adds encryption information to the resource link if there is any detected for this
 * parameter 'path' needs to be relative to the root of the publication
 * link in the epub.encryptionDoc
 */
export function getEncryptionInfo(
  encryptionDoc: Encryption | undefined,
  path: string,
  isAxisNow: boolean | undefined
) {
  const encryptionData = encryptionDoc?.EncryptedData.find(
    (data) => data.CipherData.CipherReference.URI === path
  );
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

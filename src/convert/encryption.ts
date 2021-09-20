import { Encryption } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/encryption';
import { EncryptedData } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/encryption-data';
import { AxisNowEncryptionScheme } from '../constants';
import Epub from '../Epub';
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
  const encryptionData = encryptionDoc?.EncryptedData.find(
    (data) => data.CipherData.CipherReference.URI === relativePath
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

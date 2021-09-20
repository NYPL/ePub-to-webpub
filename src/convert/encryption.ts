import { AxisNowEncryptionScheme } from '../constants';
import Epub from '../Epub';
import { EPUBExtensionLinkProperties } from '../WebpubManifestTypes/EpubExtension';

/**
 * Adds encryption information to the resource link if there is any detected for this
 * link in the epub.encryptionDoc
 */
export default function getLinkEncryption(epub: Epub, relativePath: string) {
  const encryptionData = epub.encryptionDoc?.EncryptedData.find(
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
    if (epub.isAxisNow) {
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

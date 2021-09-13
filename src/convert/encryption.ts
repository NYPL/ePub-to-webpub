import { AxisNowEncryptionScheme } from '../constants';
import Epub from '../Epub';
import { EPUBExtensionLinkProperties } from '../WebpubManifestTypes/EpubExtension';

export default function getLinkEncryption(epub: Epub, relativePath: string) {
  const encryptionData = epub.encryptionDoc?.EncryptedData.find(
    (data) => data.CipherData.CipherReference.URI === relativePath
  );
  const algorithm = encryptionData?.EncryptionMethod.Algorithm;
  let encryption: EPUBExtensionLinkProperties['encrypted'] = undefined;

  /**
   * @TODO - we currently assume the encryption scheme is AxisNow, not supporting
   * any others. We need to figure out how to decipher which scheme this is actually
   * using.
   */
  if (algorithm) {
    encryption = {
      algorithm,
      scheme: AxisNowEncryptionScheme,
    };
  }

  return encryption;
}

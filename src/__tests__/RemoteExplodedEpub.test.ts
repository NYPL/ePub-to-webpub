import RemoteExplodedEpub from '../RemoteExplodedEpub';
import { baseUrl } from './constants';

const MobyEpub2Href = `${baseUrl}/samples/moby-epub2-exploded/META-INF/container.xml`;
const MobyEpub3Href =
  'http://localhost:3000/moby-epub3-exploded/META-INF/container.xml';

it('fetches the right urls', async () => {
  const epub = await RemoteExplodedEpub.build(MobyEpub2Href);
  const manifest = await epub.webpubManifest;
});

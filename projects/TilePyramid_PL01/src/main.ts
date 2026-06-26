import { loadConfigFromGlobal } from './config/ConfigLoader';
import { loadManifestFromGlobal } from './manifest/AssetManifest';
import { createGame } from './renderer/RuntimeRenderer';

try {
  const config = loadConfigFromGlobal();
  const manifest = loadManifestFromGlobal();
  createGame(config, manifest);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  document.body.innerHTML = `<pre style="color:#ff4444;padding:1.5em;font-family:monospace;white-space:pre-wrap">Failed to start TilePyramid_PL01:\n\n${msg}</pre>`;
}

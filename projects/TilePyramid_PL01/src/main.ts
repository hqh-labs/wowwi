import { loadConfigFromGlobal } from './config/ConfigLoader';
import { loadManifestFromGlobal } from './manifest/AssetManifest';
import { createGame } from './renderer/RuntimeRenderer';

try {
  const config = loadConfigFromGlobal();
  const manifest = loadManifestFromGlobal();

  function startGame() {
    createGame(config, manifest);
  }

  const bootPolicy = window.__PLAYABLE_BOOT_POLICY__;
  if (bootPolicy && typeof bootPolicy.onReady === 'function') {
    bootPolicy.onReady(startGame);
  } else {
    startGame();
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  document.body.innerHTML = `<pre style="color:#ff4444;padding:1.5em;font-family:monospace;white-space:pre-wrap">Failed to start TilePyramid_PL01:\n\n${msg}</pre>`;
}

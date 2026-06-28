import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOP_WINDOW_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bwindow\.parent\.top\b/g, 'window.parent'],
  [/\bwindow\.top\b/g, 'window'],
  [/\bglobalThis\.top\b/g, 'window'],
  [/\bself\.top\b/g, 'window'],
  [/\bparent\.top\b/g, 'parent'],
  [/\btop\.location\b/g, 'window.location'],
];

export default defineConfig(({ mode }) => {
  const exportMode = mode === 'export';

  return {
    base: './',
    plugins: [
      {
        name: 'inject-config',
        transformIndexHtml(html: string): string {
          const cfg = readFileSync(
            resolve(__dirname, 'public/config/game.config.json'),
            'utf-8'
          );
          const mfst = readFileSync(
            resolve(__dirname, 'public/config/asset-manifest.json'),
            'utf-8'
          );
          return html.replace(
            '</head>',
            `<script>window.__GAME_CONFIG__=${cfg};window.__ASSET_MANIFEST__=${mfst};</script></head>`
          );
        },
      },
      {
        name: 'sanitize-top-window-access',
        renderChunk(code: string): string {
          return TOP_WINDOW_REPLACEMENTS.reduce(
            (nextCode, [pattern, replacement]) => nextCode.replace(pattern, replacement),
            code
          );
        },
      },
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: exportMode
          ? {
              inlineDynamicImports: true,
            }
          : {
              manualChunks: {
                phaser: ['phaser'],
              },
            },
      },
    },
  };
});

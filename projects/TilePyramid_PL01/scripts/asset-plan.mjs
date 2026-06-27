export const ASSET_PLAN = [
  {
    id: 'Background_1',
    source: '../../project-input/extracted-assets/TilePyramid_TrueGameplay/Background/Background_1.png',
    output: 'public/assets/images/optimized/background_1.webp',
    quality: 0.78,
    maxWidth: 1024,
    maxHeight: 1024,
  },
  {
    id: 'Pointer_Hand',
    source: '../../project-input/extracted-assets/TilePyramid_TrueGameplay/Pointer/1768988491461.png',
    output: 'public/assets/images/optimized/pointer_hand.webp',
    quality: 0.82,
  },
  {
    id: 'App_Icon',
    source: '../../project-input/extracted-assets/TilePyramid_TrueGameplay/App icon/Icon_PyramidQuest.png',
    output: 'public/assets/images/optimized/app_icon_384.webp',
    quality: 0.82,
    width: 384,
    height: 384,
  },
  {
    id: 'App_Logo',
    source: '../../project-input/extracted-assets/TilePyramid_TrueGameplay/Logo/Logo (1).png',
    output: 'public/assets/images/optimized/logo_520.webp',
    quality: 0.82,
    width: 520,
  },
  ...Array.from({ length: 24 }, (_, index) => {
    const n = index + 1;
    const padded = String(n).padStart(2, '0');
    return {
      id: `Tile_${padded}`,
      source: `../../project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/${n}.png`,
      output: `public/assets/images/optimized/tiles/tile_${padded}.webp`,
      quality: 0.82,
    };
  }),
];

export const BUILD_06_IMAGE_BASELINE_BYTES = 2935704;
export const BUILD_06_TOTAL_BASELINE_BYTES = 4480212;

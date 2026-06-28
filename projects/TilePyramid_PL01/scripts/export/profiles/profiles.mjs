const FIVE_MB = 5 * 1024 * 1024;

export const EXPORT_PROFILES = [
  {
    id: 'unity-2026-06',
    network: 'unity',
    displayName: 'Unity Ads',
    outputFileName: 'TilePyramid_PL01_unity.html',
    targetMaxBytes: FIVE_MB,
    outputType: 'single-html',
    inlineAssets: true,
    externalHttpResourcesAllowed: false,
    mraidRequired: true,
    mraidBootstrapAllowed: true,
    includeMraidBootstrap: false,
    orientationPolicy: 'portrait-gameplay-centered-in-landscape',
    timerFirstInteractionRequired: true,
    storeOpenBehavior: 'network-bridge-with-mraid-and-window-open-fallback',
    finalApprovalGuaranteed: false,
  },
  {
    id: 'applovin-2026-06',
    network: 'applovin',
    displayName: 'AppLovin',
    outputFileName: 'TilePyramid_PL01_applovin.html',
    targetMaxBytes: FIVE_MB,
    outputType: 'single-html',
    inlineAssets: true,
    externalHttpResourcesAllowed: false,
    mraidRequired: false,
    mraidBootstrapAllowed: false,
    includeMraidBootstrap: false,
    orientationPolicy: 'portrait-gameplay-centered-in-landscape',
    timerFirstInteractionRequired: true,
    storeOpenBehavior: 'network-bridge-with-mraid-and-window-open-fallback',
    finalApprovalGuaranteed: false,
  },
];

export function getExportProfile(idOrNetwork) {
  const profile = EXPORT_PROFILES.find(
    candidate => candidate.id === idOrNetwork || candidate.network === idOrNetwork
  );
  if (!profile) {
    throw new Error(`Unknown export profile: ${idOrNetwork}`);
  }
  return profile;
}

export function listExportProfiles() {
  return EXPORT_PROFILES.map(profile => ({ ...profile }));
}

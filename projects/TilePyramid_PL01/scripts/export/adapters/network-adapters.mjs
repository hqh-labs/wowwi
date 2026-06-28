export function createNetworkExportMetadata(profile, validation, inlinedAssets) {
  return {
    network: profile.network,
    profileId: profile.id,
    displayName: profile.displayName,
    outputType: profile.outputType,
    targetMaxBytes: profile.targetMaxBytes,
    actualBytes: validation.actualBytes,
    status: validation.status,
    warnings: validation.warnings,
    errors: validation.errors,
    mraidRequired: profile.mraidRequired,
    mraidBootstrapAllowed: profile.mraidBootstrapAllowed,
    orientationPolicy: profile.orientationPolicy,
    timerFirstInteractionRequired: profile.timerFirstInteractionRequired,
    storeOpenBehavior: profile.storeOpenBehavior,
    formalSolvability: 'NOT YET PROVEN',
    finalApprovalGuaranteed: false,
    inlinedAssetCount: inlinedAssets.length,
    inlinedAssetBytes: inlinedAssets.reduce((total, asset) => total + asset.bytes, 0),
  };
}

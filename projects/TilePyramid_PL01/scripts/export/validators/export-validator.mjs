import { stat } from 'node:fs/promises';

export async function validateExportFile({ filePath, html, profile }) {
  const stats = await stat(filePath);
  return validateExportHtml({ html, profile, actualBytes: stats.size, filePath });
}

export function validateExportHtml({ html, profile, actualBytes = Buffer.byteLength(html, 'utf8'), filePath = '' }) {
  const errors = [];
  const warnings = [];

  if (!filePath.endsWith('.html')) {
    errors.push('Export output must be a single .html file.');
  }
  if (actualBytes > profile.targetMaxBytes) {
    errors.push(`Export size ${actualBytes} exceeds target max bytes ${profile.targetMaxBytes}.`);
  }
  if (hasExternalHttpAssetReference(html)) {
    errors.push('Export contains an external HTTP/HTTPS asset reference.');
  }
  if (hasLocalRuntimeAssetReference(html)) {
    errors.push('Export contains a local runtime asset/config/dist reference.');
  }
  if (!html.includes('__PLAYABLE_NETWORK__') || !html.includes(profile.id)) {
    errors.push('Export profile metadata marker is missing.');
  }
  if (!html.includes('__PLAYABLE_STORE_OPEN__')) {
    errors.push('Store-open bridge is missing.');
  }
  if (!html.includes('playable-orientation-policy')) {
    errors.push('Orientation policy metadata is missing.');
  }
  if (!html.includes('playable-timer-first-interaction')) {
    errors.push('Timer-first-interaction policy metadata is missing.');
  }
  if (!html.includes('NOT YET PROVEN')) {
    errors.push('Formal solvability marker is missing.');
  }

  const hasMraidBootstrap = /<script\b[^>]*\bsrc=["']mraid\.js["'][^>]*><\/script>/i.test(html);
  if (hasMraidBootstrap && !profile.mraidBootstrapAllowed) {
    errors.push('mraid.js bootstrap reference is not allowed for this profile.');
  }
  if (profile.mraidRequired) {
    warnings.push(
      hasMraidBootstrap
        ? 'MRAID bootstrap reference present; final network environment must provide mraid.js.'
        : 'MRAID is required by profile but not bundled; export relies on network-provided window.mraid when available.'
    );
  }
  if (profile.finalApprovalGuaranteed === false) {
    warnings.push('Final ad-network approval is not guaranteed by BUILD-09 validation.');
  }

  return {
    profileId: profile.id,
    network: profile.network,
    filePath,
    actualBytes,
    targetMaxBytes: profile.targetMaxBytes,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
    warnings,
    checks: {
      singleHtmlFile: filePath.endsWith('.html'),
      underTargetMaxBytes: actualBytes <= profile.targetMaxBytes,
      noExternalHttpAssetReferences: !hasExternalHttpAssetReference(html),
      noLocalRuntimeAssetReferences: !hasLocalRuntimeAssetReference(html),
      profileMetadataPresent: html.includes('__PLAYABLE_NETWORK__') && html.includes(profile.id),
      storeOpenBridgePresent: html.includes('__PLAYABLE_STORE_OPEN__'),
      mraidRequired: profile.mraidRequired,
      mraidBootstrapPresent: hasMraidBootstrap,
      orientationPolicyPresent: html.includes('playable-orientation-policy'),
      timerFirstInteractionPolicyPresent: html.includes('playable-timer-first-interaction'),
      formalSolvabilityNotProven: html.includes('NOT YET PROVEN'),
    },
  };
}

export function hasExternalHttpAssetReference(html) {
  return /(?:src|href)=["']https?:\/\//i.test(html) || /url\(\s*["']?https?:\/\//i.test(html);
}

export function hasLocalRuntimeAssetReference(html) {
  return (
    /(?:src|href)=["'][^"']*(?:assets\/|config\/|dist\/)/i.test(html) ||
    /url\(\s*["']?[^"')]*(?:assets\/|config\/|dist\/)/i.test(html) ||
    /"path"\s*:\s*"\.\/(?:assets|config|dist)\//i.test(html)
  );
}

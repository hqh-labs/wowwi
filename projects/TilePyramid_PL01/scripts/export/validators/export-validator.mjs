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
  if (hasSourceMapReference(html)) {
    errors.push('Export contains a source map reference.');
  }
  if (hasUninlinedJsOrCssReference(html)) {
    errors.push('Export contains an un-inlined JavaScript or CSS file reference.');
  }
  if (hasUnresolvedPlaceholder(html)) {
    errors.push('Export contains an unresolved placeholder marker.');
  }
  for (const forbiddenAccess of findForbiddenTopWindowAccess(html)) {
    errors.push(`Forbidden top-window access detected: ${forbiddenAccess}`);
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
  if (!html.includes(profile.finalApprovalDisclaimer)) {
    errors.push('Final approval disclaimer metadata is missing.');
  }
  if (!html.includes(profile.safeAreaPolicy) || !html.includes('hostCloseButtonSafeZone')) {
    errors.push('Host close-button safe-area metadata is missing.');
  }
  if (!html.includes(profile.domOverlayPolicy)) {
    errors.push('DOM overlay policy metadata is missing.');
  }
  if (profile.requiresNoExternalResources && hasExternalHttpAssetReference(html)) {
    errors.push('Profile requires no external resources, but an external reference was found.');
  }

  const commercialErrors = validateCommercialMode(html, profile);
  errors.push(...commercialErrors);

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
    warnings.push('Final ad-network approval is not guaranteed by BUILD-10 validation.');
  }

  const commercialModeChecks = getCommercialModeChecks(html, profile);

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
      noSourceMapReferences: !hasSourceMapReference(html),
      noUninlinedJsOrCssReferences: !hasUninlinedJsOrCssReference(html),
      noUnresolvedPlaceholders: !hasUnresolvedPlaceholder(html),
      noForbiddenTopWindowAccess: !hasForbiddenTopWindowAccess(html),
      profileMetadataPresent: html.includes('__PLAYABLE_NETWORK__') && html.includes(profile.id),
      storeOpenBridgePresent: html.includes('__PLAYABLE_STORE_OPEN__'),
      storeOpenDiagnosticsPresent: html.includes('__PLAYABLE_STORE_OPEN_DIAGNOSTICS__'),
      mraidRequired: profile.mraidRequired,
      networkProvidedMraidRecorded: html.includes('"networkProvidedMraid"'),
      mraidBootstrapPresent: hasMraidBootstrap,
      orientationPolicyPresent: html.includes('playable-orientation-policy'),
      timerFirstInteractionPolicyPresent: html.includes('playable-timer-first-interaction'),
      formalSolvabilityNotProven: html.includes('NOT YET PROVEN'),
      finalApprovalDisclaimerPresent: html.includes(profile.finalApprovalDisclaimer),
      hostCloseButtonSafeZonePresent: html.includes('hostCloseButtonSafeZone'),
      domOverlayPolicyPresent: html.includes(profile.domOverlayPolicy),
      ...commercialModeChecks,
    },
  };
}

const DEBUG_FLAG_PATTERNS = [
  { key: 'debugOverlay', pattern: /"debugOverlay"\s*:\s*true/ },
  { key: 'debugBlockedState', pattern: /"debugBlockedState"\s*:\s*true/ },
  { key: 'debugMatchReadyMarker', pattern: /"debugMatchReadyMarker"\s*:\s*true/ },
  { key: 'debugOutcomeLabel', pattern: /"debugOutcomeLabel"\s*:\s*true/ },
  { key: 'debugTimerTutorialIdle', pattern: /"debugTimerTutorialIdle"\s*:\s*true/ },
  { key: 'debugCtaEndCardStore', pattern: /"debugCtaEndCardStore"\s*:\s*true/ },
  { key: 'debugAudioEffects', pattern: /"debugAudioEffects"\s*:\s*true/ },
  { key: 'timer.debugVisible', pattern: /"debugVisible"\s*:\s*true/ },
];

export function validateCommercialMode(html, profile) {
  if (profile.buildMode !== 'commercial') return [];
  const errors = [];

  if (!html.includes('"buildMode":"commercial"')) {
    errors.push('Commercial export: buildMode is not "commercial" in exported config.');
  }
  if (html.includes('"buildMode":"development"')) {
    errors.push('Commercial export: buildMode is "development" — development mode leaked into commercial export.');
  }

  for (const { key, pattern } of DEBUG_FLAG_PATTERNS) {
    if (pattern.test(html)) {
      errors.push(`Commercial export: debug flag "${key}" is true — debug must be disabled in commercial mode.`);
    }
  }

  return errors;
}

export function getCommercialModeChecks(html, profile) {
  if (profile.buildMode !== 'commercial') return { commercialModeNotApplicable: true };
  const hasCommercialBuildMode = html.includes('"buildMode":"commercial"');
  const hasNoDevBuildMode = !html.includes('"buildMode":"development"');
  const debugFlagResults = Object.fromEntries(
    DEBUG_FLAG_PATTERNS.map(({ key, pattern }) => [key, !pattern.test(html)])
  );
  return {
    commercialBuildModePresent: hasCommercialBuildMode,
    noDevBuildModeInCommercialExport: hasNoDevBuildMode,
    commercialDebugFlags: debugFlagResults,
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

export function hasSourceMapReference(html) {
  return (
    /sourceMappingURL\s*=/i.test(html) ||
    /(?:src|href)=["'][^"']+\.map(?:[?#][^"']*)?["']/i.test(html)
  );
}

export function hasUninlinedJsOrCssReference(html) {
  return (
    /<script\b[^>]*\bsrc=["'][^"']+\.(?:m?js|css)(?:[?#][^"']*)?["'][^>]*>/i.test(html) ||
    /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'][^"']+\.css(?:[?#][^"']*)?["'][^>]*>/i.test(html)
  );
}

export function hasUnresolvedPlaceholder(html) {
  return /{{\s*[\w.-]+\s*}}|%%[\w.-]+%%|__REPLACE_[A-Z0-9_]+__|TODO_EXPORT|REPLACE_ME/i.test(html);
}

const FORBIDDEN_TOP_WINDOW_ACCESS_PATTERNS = [
  { label: 'window.parent.top', pattern: /\bwindow\.parent\.top\b/ },
  { label: 'window.top', pattern: /\bwindow\.top\b/ },
  { label: 'globalThis.top', pattern: /\bglobalThis\.top\b/ },
  { label: 'self.top', pattern: /\bself\.top\b/ },
  { label: 'parent.top', pattern: /\bparent\.top\b/ },
  { label: 'top.location', pattern: /\btop\.location\b/ },
];

export function findForbiddenTopWindowAccess(html) {
  return FORBIDDEN_TOP_WINDOW_ACCESS_PATTERNS
    .filter(({ pattern }) => pattern.test(html))
    .map(({ label }) => label);
}

export function hasForbiddenTopWindowAccess(html) {
  return findForbiddenTopWindowAccess(html).length > 0;
}

export function createStoreOpenBridgeScript(profile, generatedAt) {
  const runtime = {
    profileId: profile.id,
    network: profile.network,
    generatedAt,
    targetMaxBytes: profile.targetMaxBytes,
    orientationPolicy: profile.orientationPolicy,
    timerFirstInteraction: profile.timerFirstInteractionRequired,
    formalSolvability: 'NOT YET PROVEN',
  };

  return `<script>
(function(){
  window.__PLAYABLE_NETWORK__=${JSON.stringify(runtime)};
  window.__PLAYABLE_STORE_OPEN__=function(payload){
    var url = payload && payload.url ? String(payload.url) : 'about:blank';
    try {
      if (window.mraid && typeof window.mraid.open === 'function') {
        window.mraid.open(url);
        return { handled: true, method: 'mraid' };
      }
      if (typeof window.open === 'function') {
        window.open(url, '_blank', 'noopener');
        return { handled: true, method: 'window-open' };
      }
      window.location.href = url;
      return { handled: true, method: 'location' };
    } catch (error) {
      return { handled: false, method: 'none', error: error && error.message ? error.message : String(error) };
    }
  };
})();
</script>`;
}

export function createStoreOpenBridgeScript(profile, generatedAt, appConfig = {}) {
  const storeUrls = {
    androidUrl: appConfig.androidUrl ?? '',
    iosUrl: appConfig.iosUrl ?? '',
    fallbackUrl: appConfig.fallbackUrl ?? '',
  };
  const runtime = {
    profileId: profile.id,
    network: profile.network,
    generatedAt,
    targetMaxBytes: profile.targetMaxBytes,
    orientationPolicy: profile.orientationPolicy,
    timerFirstInteraction: profile.timerFirstInteractionRequired,
    mraidRequired: profile.mraidRequired,
    networkProvidedMraid: profile.networkProvidedMraid,
    requiresNoExternalResources: profile.requiresNoExternalResources,
    hostCloseButtonSafeZone: profile.hostCloseButtonSafeZone,
    safeAreaPolicy: profile.safeAreaPolicy,
    domOverlayPolicy: profile.domOverlayPolicy,
    finalApprovalDisclaimer: profile.finalApprovalDisclaimer,
    androidStoreUrl: storeUrls.androidUrl,
    iosStoreUrl: storeUrls.iosUrl,
    fallbackStoreUrl: storeUrls.fallbackUrl,
    storeUrls,
    formalSolvability: 'NOT YET PROVEN',
  };

  return `<script>
(function(){
  window.__PLAYABLE_NETWORK__=${JSON.stringify(runtime)};
  window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__={
    network:${JSON.stringify(profile.network)},
    source:null,
    attemptedUrl:null,
    methodUsed:null,
    errorCount:0,
    lastErrorMessage:null,
    androidStoreUrl:${JSON.stringify(storeUrls.androidUrl)},
    iosStoreUrl:${JSON.stringify(storeUrls.iosUrl)},
    fallbackStoreUrl:${JSON.stringify(storeUrls.fallbackUrl)},
    androidUrl:${JSON.stringify(storeUrls.androidUrl)},
    iosUrl:${JSON.stringify(storeUrls.iosUrl)},
    fallbackUrl:${JSON.stringify(storeUrls.fallbackUrl)},
    selectedFallbackUrl:${JSON.stringify(storeUrls.fallbackUrl)}
  };
  function diagnostics(){
    return window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__;
  }
  function record(payload, method, error){
    var state=diagnostics();
    state.network=${JSON.stringify(profile.network)};
    state.source=payload && payload.source ? String(payload.source) : 'unknown';
    state.attemptedUrl=payload && payload.url ? String(payload.url) : 'about:blank';
    state.methodUsed=method;
    if(error){
      state.errorCount+=1;
      state.lastErrorMessage=error && error.message ? String(error.message).slice(0,240) : String(error).slice(0,240);
    }
  }
  function getMraid(){
    try {
      return window.mraid && typeof window.mraid === 'object' ? window.mraid : null;
    } catch(error) {
      record({source:'unknown',url:'about:blank'}, 'failed', error);
      return null;
    }
  }
  function getMraidState(mraid){
    try {
      return mraid && typeof mraid.getState === 'function' ? String(mraid.getState()) : 'unknown';
    } catch(error) {
      record({source:'unknown',url:'about:blank'}, 'failed', error);
      return 'unknown';
    }
  }
  function openWithBrowserFallback(payload, url){
    if(window.__PLAYABLE_QA_MODE__===true){
      record(payload, 'record-only');
      return { handled:true, method:'record-only' };
    }
    try {
      if(typeof window.open === 'function'){
        window.open(url, '_blank', 'noopener');
        record(payload, 'window.open');
        return { handled:true, method:'window.open' };
      }
      window.location.href=url;
      record(payload, 'location.href');
      return { handled:true, method:'location.href' };
    } catch(error) {
      record(payload, 'failed', error);
      return { handled:false, method:'failed', error: error && error.message ? error.message : String(error) };
    }
  }
  window.__PLAYABLE_STORE_OPEN__=function(payload){
    var url = payload && payload.url ? String(payload.url) : 'about:blank';
    if(window.__PLAYABLE_QA_MODE__===true){
      record(payload, 'record-only');
      return { handled: true, method: 'record-only' };
    }
    try {
      var mraid=getMraid();
      if (mraid && typeof mraid.open === 'function') {
        var state=getMraidState(mraid);
        if(state === 'loading' && typeof mraid.addEventListener === 'function'){
          var opened=false;
          var fallbackTimer=setTimeout(function(){
            if(opened) return;
            opened=true;
            openWithBrowserFallback(payload, url);
          }, 1000);
          var onReady=function(){
            if(opened) return;
            opened=true;
            clearTimeout(fallbackTimer);
            try {
              mraid.open(url);
              record(payload, 'mraid.open');
            } catch(error) {
              record(payload, 'failed', error);
              openWithBrowserFallback(payload, url);
            }
          };
          mraid.addEventListener('ready', onReady);
          return { handled: true, method: 'mraid.open' };
        }
        mraid.open(url);
        record(payload, 'mraid.open');
        return { handled: true, method: 'mraid.open' };
      }
      return openWithBrowserFallback(payload, url);
    } catch (error) {
      record(payload, 'failed', error);
      return { handled: false, method: 'failed', error: error && error.message ? error.message : String(error) };
    }
  };
})();
</script>`;
}

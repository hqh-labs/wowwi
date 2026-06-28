/**
 * Generates the AppLovin viewability-gated boot policy script.
 *
 * Design:
 * - If window.mraid exists and is viewable → boot immediately
 * - If window.mraid exists but not viewable → wait for viewableChange
 * - If window.mraid absent → boot immediately (local browser, Unity, non-MRAID networks)
 * - One-shot guard prevents double boot
 * - 3-second safety timeout ensures boot always happens
 *
 * window.__PLAYABLE_BOOT_POLICY__.onReady(fn) is called by main.ts
 * before Phaser starts. In development/Unity exports this global is absent
 * and main.ts boots immediately.
 */
export function createBootPolicyScript(profile) {
  if (!profile.viewabilityGate) return '';

  return `<script>
(function(){
  var booted=false;
  var readyFn=null;
  var fallbackTimer=null;
  function boot(){
    if(booted)return;
    booted=true;
    if(fallbackTimer){clearTimeout(fallbackTimer);fallbackTimer=null;}
    if(typeof readyFn==='function'){readyFn();}
  }
  function tryMraidGate(){
    try{
      var mraid=window.mraid;
      if(!mraid||typeof mraid!=='object'){boot();return;}
      if(typeof mraid.isViewable==='function'&&mraid.isViewable()){boot();return;}
      if(typeof mraid.addEventListener==='function'){
        var handler=function(visible){
          if(visible){
            try{mraid.removeEventListener('viewableChange',handler);}catch(e){}
            boot();
          }
        };
        mraid.addEventListener('viewableChange',handler);
      } else {
        boot();
      }
    }catch(e){
      boot();
    }
  }
  window.__PLAYABLE_BOOT_POLICY__={
    network:${JSON.stringify(profile.network)},
    viewabilityGate:true,
    onReady:function(fn){
      readyFn=fn;
      fallbackTimer=setTimeout(function(){boot();},3000);
      tryMraidGate();
    }
  };
})();
</script>`;
}

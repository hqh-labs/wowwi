export type StoreOpenSource = 'gameplay-cta' | 'end-card' | 'unknown';
export type StoreOpenMode = 'record-only' | 'navigate';

export interface StoreOpenConfig {
  fallbackUrl: string;
  androidUrl?: string;
  iosUrl?: string;
  mode: StoreOpenMode;
  safeDevelopmentNavigation: boolean;
}

export interface StoreOpenEvent {
  source: StoreOpenSource;
  url: string;
  platform: StorePlatform;
}

export interface StoreOpenState {
  mode: StoreOpenMode;
  callCount: number;
  lastSource: StoreOpenSource | null;
  lastUrl: string | null;
  lastPlatform: StorePlatform | null;
  fallbackUrl: string;
  androidUrl: string | null;
  iosUrl: string | null;
  events: StoreOpenEvent[];
}

export interface StoreNavigator {
  open(url: string): void;
}

export type StorePlatform = 'android' | 'ios' | 'fallback';

export interface StoreUrlSelection {
  platform: StorePlatform;
  url: string;
}

export function createStoreOpenState(config: StoreOpenConfig): StoreOpenState {
  return {
    mode: config.mode,
    callCount: 0,
    lastSource: null,
    lastUrl: null,
    lastPlatform: null,
    fallbackUrl: config.fallbackUrl,
    androidUrl: config.androidUrl ?? null,
    iosUrl: config.iosUrl ?? null,
    events: [],
  };
}

export class StoreOpenService {
  private state: StoreOpenState;

  constructor(
    private readonly config: StoreOpenConfig,
    private readonly navigator: StoreNavigator = { open: url => window.open(url, '_blank', 'noopener') }
  ) {
    this.state = createStoreOpenState(config);
  }

  openStore(source: StoreOpenSource = 'unknown'): StoreOpenState {
    const selection = selectStoreUrl(this.config);
    const event = { source, url: selection.url, platform: selection.platform };
    this.state = {
      ...this.state,
      callCount: this.state.callCount + 1,
      lastSource: source,
      lastUrl: selection.url,
      lastPlatform: selection.platform,
      events: [...this.state.events, event],
    };

    if (this.config.mode === 'navigate' && !this.config.safeDevelopmentNavigation) {
      const bridge = window.__PLAYABLE_STORE_OPEN__;
      if (bridge) {
        bridge({ source, url: selection.url, network: window.__PLAYABLE_NETWORK__?.network });
      } else {
        this.navigator.open(selection.url);
      }
    }

    return this.getSnapshot();
  }

  getSnapshot(): StoreOpenState {
    return {
      ...this.state,
      events: [...this.state.events],
    };
  }
}

export function chooseStoreUrl(config: StoreOpenConfig, userAgent = getRuntimeUserAgent()): string {
  return selectStoreUrl(config, userAgent).url;
}

export function selectStoreUrl(config: StoreOpenConfig, userAgent = getRuntimeUserAgent()): StoreUrlSelection {
  const platform = detectStorePlatform(userAgent);
  if (platform === 'ios' && config.iosUrl) {
    return { platform: 'ios', url: config.iosUrl };
  }
  if (platform === 'android' && config.androidUrl) {
    return { platform: 'android', url: config.androidUrl };
  }
  return {
    platform: 'fallback',
    url: config.fallbackUrl || config.androidUrl || config.iosUrl || 'about:blank',
  };
}

export function detectStorePlatform(userAgent = ''): StorePlatform {
  const normalized = userAgent.toLowerCase();
  if (/(iphone|ipad|ipod)/.test(normalized)) return 'ios';
  if (/android/.test(normalized)) return 'android';
  return 'fallback';
}

function getRuntimeUserAgent(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

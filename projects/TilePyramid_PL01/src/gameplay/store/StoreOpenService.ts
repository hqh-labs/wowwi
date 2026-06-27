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
}

export interface StoreOpenState {
  mode: StoreOpenMode;
  callCount: number;
  lastSource: StoreOpenSource | null;
  lastUrl: string | null;
  events: StoreOpenEvent[];
}

export interface StoreNavigator {
  open(url: string): void;
}

export function createStoreOpenState(mode: StoreOpenMode): StoreOpenState {
  return {
    mode,
    callCount: 0,
    lastSource: null,
    lastUrl: null,
    events: [],
  };
}

export class StoreOpenService {
  private state: StoreOpenState;

  constructor(
    private readonly config: StoreOpenConfig,
    private readonly navigator: StoreNavigator = { open: url => window.open(url, '_blank', 'noopener') }
  ) {
    this.state = createStoreOpenState(config.mode);
  }

  openStore(source: StoreOpenSource = 'unknown'): StoreOpenState {
    const url = chooseStoreUrl(this.config);
    const event = { source, url };
    this.state = {
      ...this.state,
      callCount: this.state.callCount + 1,
      lastSource: source,
      lastUrl: url,
      events: [...this.state.events, event],
    };

    if (this.config.mode === 'navigate' && !this.config.safeDevelopmentNavigation) {
      this.navigator.open(url);
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

export function chooseStoreUrl(config: StoreOpenConfig): string {
  return config.fallbackUrl || config.androidUrl || config.iosUrl || 'about:blank';
}

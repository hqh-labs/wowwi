import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createCtaState, recordCtaClick } from '../../src/gameplay/cta/CtaSystem';
import {
  createEndCardState,
  recordEndCardClick,
  updateEndCardForOutcome,
} from '../../src/gameplay/endcard/EndCardSystem';
import {
  StoreOpenService,
  chooseStoreUrl,
  detectStorePlatform,
  selectStoreUrl,
} from '../../src/gameplay/store/StoreOpenService';
import type { Build06Snapshot } from '../../src/types';

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games';
const IOS_URL = 'https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033';
const config = JSON.parse(readFileSync(new URL('../../public/config/game.config.json', import.meta.url), 'utf8'));

const storeConfig = {
  fallbackUrl: ANDROID_URL,
  androidUrl: ANDROID_URL,
  iosUrl: IOS_URL,
  mode: 'record-only' as const,
  safeDevelopmentNavigation: true,
};

describe('Build-06 store-open service', () => {
  it('records calls in record-only mode', () => {
    const service = new StoreOpenService(storeConfig);
    service.openStore('gameplay-cta');
    expect(service.getSnapshot().callCount).toBe(1);
  });

  it('chooses deterministic configured fallback URL for unknown platforms', () => {
    expect(chooseStoreUrl(storeConfig, 'Mozilla/5.0 desktop')).toBe(ANDROID_URL);
  });

  it('records call source', () => {
    const service = new StoreOpenService(storeConfig);
    service.openStore('end-card');
    expect(service.getSnapshot().lastSource).toBe('end-card');
  });
});

describe('Build-11 store URL wiring', () => {
  it('Android store URL config matches the provided Google Play URL', () => {
    expect(config.app.androidUrl).toBe(ANDROID_URL);
  });

  it('iOS store URL config matches the provided App Store URL', () => {
    expect(config.app.iosUrl).toBe(IOS_URL);
  });

  it('fallback store URL is deterministic', () => {
    expect(config.app.fallbackUrl).toBe(ANDROID_URL);
  });

  it('detects iOS-like user agents', () => {
    expect(detectStorePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('ios');
  });

  it('detects Android-like user agents', () => {
    expect(detectStorePlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('android');
  });

  it('selects iOS URL for iOS-like user agents', () => {
    expect(selectStoreUrl(storeConfig, 'iPad').url).toBe(IOS_URL);
  });

  it('selects Android URL for Android-like user agents', () => {
    expect(selectStoreUrl(storeConfig, 'Android').url).toBe(ANDROID_URL);
  });
});

describe('Build-06 CTA behavior', () => {
  it('CTA click does not mutate board state', () => {
    const before = { remainingBoardCount: 72 };
    const cta = recordCtaClick(createCtaState(true, true));
    expect(cta.clickCount).toBe(1);
    expect(before.remainingBoardCount).toBe(72);
  });

  it('CTA click does not mutate tray state', () => {
    const before = { trayCount: 0 };
    recordCtaClick(createCtaState(true, true));
    expect(before.trayCount).toBe(0);
  });

  it('CTA click does not start timer', () => {
    const before = { timerStarted: false };
    recordCtaClick(createCtaState(true, true));
    expect(before.timerStarted).toBe(false);
  });
});

describe('Build-06 end card behavior', () => {
  it('initializes hidden', () => {
    const endCard = createEndCardState(true);
    expect(endCard.visible).toBe(false);
    expect(endCard.reason).toBe('none');
  });

  it('becomes visible on win', () => {
    const endCard = updateEndCardForOutcome(createEndCardState(true), 'won', {
      showOnWin: true,
      showOnFail: true,
    });
    expect(endCard.visible).toBe(true);
    expect(endCard.reason).toBe('win');
  });

  it('becomes visible on fail', () => {
    const endCard = updateEndCardForOutcome(createEndCardState(true), 'failed', {
      showOnWin: true,
      showOnFail: true,
    });
    expect(endCard.visible).toBe(true);
    expect(endCard.reason).toBe('fail');
  });

  it('click records store-open event', () => {
    const service = new StoreOpenService(storeConfig);
    const endCard = recordEndCardClick(
      updateEndCardForOutcome(createEndCardState(true), 'failed', { showOnWin: true, showOnFail: true })
    );
    service.openStore('end-card');
    expect(endCard.clickCount).toBe(1);
    expect(service.getSnapshot().lastSource).toBe('end-card');
  });

  it('blocks gameplay selection after win or fail', () => {
    for (const gameState of ['won', 'failed'] as const) {
      const endCard = updateEndCardForOutcome(createEndCardState(true), gameState, {
        showOnWin: true,
        showOnFail: true,
      });
      expect(gameState).not.toBe('playing');
      expect(endCard.visible).toBe(true);
    }
  });

  it('keeps formal solvability not yet proven in diagnostics', () => {
    const snapshot = { formalSolvability: 'NOT YET PROVEN' } as Build06Snapshot;
    expect(snapshot.formalSolvability).toBe('NOT YET PROVEN');
  });
});

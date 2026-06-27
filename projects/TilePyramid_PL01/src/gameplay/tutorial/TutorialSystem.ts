export interface TutorialState {
  enabled: boolean;
  active: boolean;
  dismissed: boolean;
  text: string;
  previewTileIds: string[];
}

export function createTutorialState(options: {
  enabled: boolean;
  text: string;
  previewTileIds: string[];
}): TutorialState {
  return {
    enabled: options.enabled,
    active: options.enabled,
    dismissed: false,
    text: options.text,
    previewTileIds: [...options.previewTileIds],
  };
}

export function handleTutorialInteraction(
  state: TutorialState,
  interaction: 'valid-selectable' | 'blocked',
  dismissOnFirstValidTap: boolean
): TutorialState {
  if (!state.active || interaction !== 'valid-selectable' || !dismissOnFirstValidTap) return state;
  return {
    ...state,
    active: false,
    dismissed: true,
  };
}

export function hideTutorialAfterOutcome(state: TutorialState): TutorialState {
  if (!state.active) return state;
  return {
    ...state,
    active: false,
  };
}

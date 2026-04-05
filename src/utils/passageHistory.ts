export type PassageItem = {
  id: string;
  lines: string[];
  sourceText: string;
};

export type PassageHistoryState = {
  past: PassageItem[];
  currentIndex: number; // -1 = 아직 아무 문장도 본 적 없음
};

export function createInitialPassageHistoryState(): PassageHistoryState {
  return {
    past: [],
    currentIndex: -1,
  };
}

export function resetPassageHistory(): PassageHistoryState {
  return createInitialPassageHistoryState();
}

export function hasCurrentPassage(state: PassageHistoryState): boolean {
  return state.currentIndex >= 0 && state.currentIndex < state.past.length;
}

export function getCurrentPassage(state: PassageHistoryState): PassageItem | null {
  if (!hasCurrentPassage(state)) {
    return null;
  }

  return state.past[state.currentIndex] ?? null;
}

export function canGoToPreviousPassage(state: PassageHistoryState): boolean {
  return state.currentIndex > 0;
}

export function canGoToNextSeenPassage(state: PassageHistoryState): boolean {
  return state.currentIndex >= 0 && state.currentIndex < state.past.length - 1;
}

export function appendPassage(
  state: PassageHistoryState,
  passage: PassageItem,
): PassageHistoryState {
  const nextPast = [...state.past, passage];

  return {
    past: nextPast,
    currentIndex: nextPast.length - 1,
  };
}

export function moveToPreviousPassage(
  state: PassageHistoryState,
): PassageHistoryState {
  if (!canGoToPreviousPassage(state)) {
    return state;
  }

  return {
    ...state,
    currentIndex: state.currentIndex - 1,
  };
}

export function moveToNextSeenPassage(
  state: PassageHistoryState,
): PassageHistoryState {
  if (!canGoToNextSeenPassage(state)) {
    return state;
  }

  return {
    ...state,
    currentIndex: state.currentIndex + 1,
  };
}
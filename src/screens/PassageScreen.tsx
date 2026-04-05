import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { AdaptiveBackground } from '../components/AdaptiveBackground';
import { AnimatedPassageText } from '../components/AnimatedPassageText';
import {
  PassageSourceText,
  buildSourceTypography,
  FontVariant,
} from '../components/PassageSourceText';
import { BottomDotButton } from '../components/BottomDotButton';
import { MenuSlideSheet } from '../components/MenuSlideSheet';
import { UserBackgroundManagerSheet } from '../components/UserBackgroundManagerSheet';
import { usePassage } from '../hooks/usePassage';
import { useOrientation } from '../hooks/useOrientation';
import type { MenuSelectionState } from '../types/menu';
import { INITIAL_MENU_SELECTIONS } from '../types/menu';
import {
  appendPassage,
  canGoToNextSeenPassage,
  canGoToPreviousPassage,
  createInitialPassageHistoryState,
  getCurrentPassage,
  moveToNextSeenPassage,
  moveToPreviousPassage,
  resetPassageHistory,
} from '../utils/passageHistory';

const TEXT_DELAY_MS = 1400;
const BASE_FONT_SIZE = 20;
const SOURCE_CHARS_PER_LINE = 14;
const ALLOWED_LANGUAGES: Array<MenuSelectionState['language']> = ['ko', 'en'];

const TAP_MAX_DISTANCE = 18;
const SWIPE_ACTIVATION_DISTANCE = 1;
const SWIPE_TRIGGER_DISTANCE = 2;
const SWIPE_DIRECTION_RATIO = 0.4;
const SWIPE_MAX_VERTICAL_DRIFT = 120;
const MENU_BACKGROUND_BLUR_RADIUS = 28;
const DOUBLE_TAP_DELAY_MS = 260;
const MAX_USER_BACKGROUNDS = 12;

type BackgroundMode = 'auto' | 'user';
type OverlayMode = 'none' | 'menu' | 'userBackgroundManager';

const FONT_FAMILY_BY_VARIANT: Record<FontVariant, string> = {
  default: 'NotoSansKR-Regular',
  soft: 'NanumMyeongjo-Regular',
  handwriting: 'NanumPenScript-Regular',
};

const getFontVariant = (font: MenuSelectionState['font']): FontVariant => {
  if (font === 'soft') {
    return 'soft';
  }
  if (font === 'script') {
    return 'handwriting';
  }
  return 'default';
};

const getBodyFontSize = (variant: FontVariant): number => {
  switch (variant) {
    case 'soft':
      return BASE_FONT_SIZE + 0;
    case 'handwriting':
      return BASE_FONT_SIZE + 10;
    default:
      return BASE_FONT_SIZE;
  }
};

const getParagraphFontStyle = (
  fontsLoaded: boolean | undefined,
  variant: FontVariant,
): { fontFamily: string } | undefined => {
  if (!fontsLoaded) {
    return undefined;
  }

  return { fontFamily: FONT_FAMILY_BY_VARIANT[variant] };
};

const estimateSourceHeight = (
  text: string | undefined,
  baseFontSize: number,
  variant: FontVariant,
): number => {
  const trimmed = text?.trim();
  if (!trimmed) {
    return 0;
  }

  const { lineHeight } = buildSourceTypography(baseFontSize, variant);
  const resolvedLineHeight = typeof lineHeight === 'number' ? lineHeight : baseFontSize * 1.45;
  const segments = trimmed.split(/\n+/).filter(Boolean);

  const approximateLines =
    segments.length > 0
      ? segments.reduce((total, segment) => {
          const length = segment.trim().length || SOURCE_CHARS_PER_LINE;
          return total + Math.max(1, Math.ceil(length / SOURCE_CHARS_PER_LINE));
        }, 0)
      : Math.max(1, Math.ceil(trimmed.length / SOURCE_CHARS_PER_LINE));

  return resolvedLineHeight * Math.max(1, approximateLines);
};

const createBackgroundToken = (): string =>
  `bg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const dedupeUris = (uris: string[]): string[] => {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const uri of uris) {
    if (!uri || seen.has(uri)) {
      continue;
    }
    seen.add(uri);
    next.push(uri);
  }

  return next;
};

const pickRandomUri = (uris: string[], excludeUri?: string | null): string | null => {
  if (!uris.length) {
    return null;
  }

  if (uris.length === 1) {
    return uris[0];
  }

  const pool =
    excludeUri && uris.includes(excludeUri)
      ? uris.filter((uri) => uri !== excludeUri)
      : uris;

  const targetPool = pool.length ? pool : uris;
  const index = Math.floor(Math.random() * targetPool.length);
  return targetPool[index] ?? uris[0] ?? null;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gestureLayer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  containerLandscape: {
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  textBlock: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 24,
  },
  textBlockPortrait: {
    transform: [{ translateY: -72 }],
  },
  textBlockLandscape: {
    paddingTop: 24,
    transform: [{ translateY: -12 }],
  },
  paragraphContainer: {
    width: '100%',
  },
  paragraph: {
    fontSize: BASE_FONT_SIZE,
    lineHeight: 32,
    color: '#ffffff',
    textAlign: 'left',
  },
  sourceReserve: {
    width: '100%',
  },
  bottomButton: {
    position: 'absolute',
    right: 28,
    bottom: 24,
  },
});

type PassageScreenProps = {
  onExitService: () => void;
  initialMenuVisible?: boolean;
  fontsLoaded?: boolean;
};

export const PassageScreen: React.FC<PassageScreenProps> = ({
  onExitService: _onExitService,
  initialMenuVisible = true,
  fontsLoaded,
}) => {
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  const [menuSelections, setMenuSelections] = useState<MenuSelectionState>(INITIAL_MENU_SELECTIONS);
  const [draftSelections, setDraftSelections] = useState<MenuSelectionState>(INITIAL_MENU_SELECTIONS);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(initialMenuVisible ? 'menu' : 'none');

  const [isBackgroundReady, setBackgroundReady] = useState(false);
  const [isTextReady, setTextReady] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [historyState, setHistoryState] = useState(createInitialPassageHistoryState());
  const [shouldStartNewSelection, setShouldStartNewSelection] = useState(false);
  const [currentBackgroundToken, setCurrentBackgroundToken] = useState<string>(() =>
    createBackgroundToken(),
  );
  const [menuBackgroundToken, setMenuBackgroundToken] = useState<string>(() =>
    createBackgroundToken(),
  );

  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('auto');

  const [storedUserBackgrounds, setStoredUserBackgrounds] = useState<string[]>([]);
  const [appliedUserBackgrounds, setAppliedUserBackgrounds] = useState<string[]>([]);
  const [currentUserBackgroundUri, setCurrentUserBackgroundUri] = useState<string | null>(null);

  const [draftUserBackgrounds, setDraftUserBackgrounds] = useState<string[]>([]);
  const [draftSelectedUserBackgrounds, setDraftSelectedUserBackgrounds] = useState<string[]>([]);

  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimestampRef = useRef(0);
  const gestureHandledRef = useRef(false);

  const passageBackgroundMapRef = useRef<Record<string, string>>({});
  const passageUserBackgroundUriMapRef = useRef<Record<string, string>>({});

  const isMenuVisible = overlayMode === 'menu';
  const isUserBackgroundManagerVisible = overlayMode === 'userBackgroundManager';

  const effectiveBackgroundMode: 'auto' | 'user' = useMemo(() => {
    if (backgroundMode === 'user' && appliedUserBackgrounds.length > 0) {
      return 'user';
    }

    return 'auto';
  }, [appliedUserBackgrounds.length, backgroundMode]);

  const fontVariant = useMemo(
    () => getFontVariant(menuSelections.font),
    [menuSelections.font],
  );

  const paragraphFontStyle = useMemo(
    () => getParagraphFontStyle(fontsLoaded, fontVariant),
    [fontsLoaded, fontVariant],
  );

  const bodyFontSize = useMemo(
    () => getBodyFontSize(fontVariant),
    [fontVariant],
  );

  const { hasPassages, pickNextPassage } = usePassage(menuSelections);

  const currentPassage = useMemo(
    () => getCurrentPassage(historyState),
    [historyState],
  );

  const combinedText = useMemo(
    () => (currentPassage ? currentPassage.lines.join(' ').trim() : ''),
    [currentPassage],
  );

  const sourceText = useMemo(
    () => currentPassage?.sourceText ?? '',
    [currentPassage],
  );

  const sourceReserveHeight = useMemo(
    () => estimateSourceHeight(sourceText, bodyFontSize, fontVariant),
    [sourceText, bodyFontSize, fontVariant],
  );

  const hasCurrent = Boolean(currentPassage);
  const canGoPrev = canGoToPreviousPassage(historyState);
  const isGestureEnabled =
    !isMenuVisible &&
    !isUserBackgroundManagerVisible &&
    isTextReady &&
    showSource &&
    hasCurrent;

  const isMenuButtonEnabled = !isMenuVisible && !isUserBackgroundManagerVisible && showSource;

  const activeBackgroundKey = useMemo(() => {
    if (effectiveBackgroundMode === 'user') {
      return isMenuVisible || isUserBackgroundManagerVisible
        ? `menu-user-${currentUserBackgroundUri ?? 'empty'}`
        : `passage-user-${currentUserBackgroundUri ?? 'empty'}`;
    }

    return isMenuVisible || isUserBackgroundManagerVisible
      ? `menu-${menuBackgroundToken}`
      : `passage-${currentBackgroundToken}`;
  }, [
    effectiveBackgroundMode,
    isMenuVisible,
    isUserBackgroundManagerVisible,
    currentUserBackgroundUri,
    menuBackgroundToken,
    currentBackgroundToken,
  ]);

  const resetVisualPresentation = useCallback(() => {
    setBackgroundReady(false);
    setTextReady(false);
    setShowSource(false);
  }, []);

  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }, []);

  const syncBackgroundSelectionState = useCallback((mode: 'auto' | 'upload') => {
    setMenuSelections((prev) => ({
      ...prev,
      background: mode,
    }));
    setDraftSelections((prev) => ({
      ...prev,
      background: mode,
    }));
  }, []);

  const launchUserBackgroundPicker = useCallback(async (limit: number): Promise<string[]> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, Math.min(limit, MAX_USER_BACKGROUNDS)),
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return [];
    }

    return result.assets
      .map((asset) => asset.uri)
      .filter((uri): uri is string => typeof uri === 'string' && uri.length > 0);
  }, []);

  const openMenu = useCallback(() => {
    clearSingleTapTimer();
    setDraftSelections({
      ...menuSelections,
      selectedCategories: [...menuSelections.selectedCategories],
      background: backgroundMode === 'user' ? 'upload' : 'auto',
    });
    setMenuBackgroundToken(createBackgroundToken());
    setOverlayMode('menu');
    resetVisualPresentation();
  }, [backgroundMode, clearSingleTapTimer, menuSelections, resetVisualPresentation]);

  const closeMenu = useCallback(() => {
    clearSingleTapTimer();
    setOverlayMode('none');
    resetVisualPresentation();
  }, [clearSingleTapTimer, resetVisualPresentation]);

  const openUserBackgroundManager = useCallback((): boolean => {
    if (isLandscape) {
      return false;
    }

    setDraftUserBackgrounds(storedUserBackgrounds.slice(0, MAX_USER_BACKGROUNDS));
    setDraftSelectedUserBackgrounds(
      (appliedUserBackgrounds.length > 0 ? appliedUserBackgrounds : storedUserBackgrounds).slice(
        0,
        MAX_USER_BACKGROUNDS,
      ),
    );
    setMenuBackgroundToken(createBackgroundToken());
    setOverlayMode('userBackgroundManager');
    resetVisualPresentation();
    return true;
  }, [appliedUserBackgrounds, isLandscape, resetVisualPresentation, storedUserBackgrounds]);

  const handleOpenUserBackgroundManager = useCallback(async (): Promise<boolean> => {
    clearSingleTapTimer();
    syncBackgroundSelectionState('upload');
    return openUserBackgroundManager();
  }, [clearSingleTapTimer, openUserBackgroundManager, syncBackgroundSelectionState]);

  const handleSelectAutoBackground = useCallback(() => {
    setBackgroundMode('auto');
    setCurrentUserBackgroundUri(null);
    syncBackgroundSelectionState('auto');
    resetVisualPresentation();
  }, [resetVisualPresentation, syncBackgroundSelectionState]);

  const closeUserBackgroundManager = useCallback(() => {
    setDraftUserBackgrounds([]);
    setDraftSelectedUserBackgrounds([]);
    setOverlayMode('menu');
    setMenuBackgroundToken(createBackgroundToken());
    resetVisualPresentation();
  }, [resetVisualPresentation]);

  const handleAddUserBackgrounds = useCallback(async () => {
    if (isLandscape) {
      return;
    }

    const remaining = MAX_USER_BACKGROUNDS - draftUserBackgrounds.length;

    if (remaining <= 0) {
      return;
    }

    const pickedUris = dedupeUris(await launchUserBackgroundPicker(remaining));

    if (!pickedUris.length) {
      return;
    }

    setDraftUserBackgrounds((prev) =>
      dedupeUris([...prev, ...pickedUris]).slice(0, MAX_USER_BACKGROUNDS),
    );
    setDraftSelectedUserBackgrounds((prev) =>
      dedupeUris([...prev, ...pickedUris]).slice(0, MAX_USER_BACKGROUNDS),
    );
  }, [draftUserBackgrounds.length, isLandscape, launchUserBackgroundPicker]);

  const handleToggleUserBackgroundSelection = useCallback((uri: string) => {
    setDraftSelectedUserBackgrounds((prev) =>
      prev.includes(uri) ? prev.filter((item) => item !== uri) : [...prev, uri],
    );
  }, []);

  const handleDeleteSelectedUserBackgrounds = useCallback(() => {
    if (!draftSelectedUserBackgrounds.length) {
      return;
    }

    const selectedSet = new Set(draftSelectedUserBackgrounds);

    setDraftUserBackgrounds((prev) => prev.filter((uri) => !selectedSet.has(uri)));
    setDraftSelectedUserBackgrounds([]);
  }, [draftSelectedUserBackgrounds]);

  const handleApplyUserBackgrounds = useCallback(() => {
    const confirmedLibrary = dedupeUris(draftUserBackgrounds).slice(0, MAX_USER_BACKGROUNDS);
    const confirmedSelection = dedupeUris(
      draftSelectedUserBackgrounds.filter((uri) => confirmedLibrary.includes(uri)),
    ).slice(0, MAX_USER_BACKGROUNDS);

    if (!confirmedSelection.length) {
      return;
    }

    const nextCurrentUri =
      confirmedSelection.length === 1
        ? confirmedSelection[0]
        : pickRandomUri(confirmedSelection, currentUserBackgroundUri) ?? confirmedSelection[0];

    setStoredUserBackgrounds(confirmedLibrary);
    setAppliedUserBackgrounds(confirmedSelection);
    setCurrentUserBackgroundUri(nextCurrentUri);
    setBackgroundMode('user');
    syncBackgroundSelectionState('upload');
    passageUserBackgroundUriMapRef.current = {};
    setDraftUserBackgrounds([]);
    setDraftSelectedUserBackgrounds([]);
    setOverlayMode('menu');
    setMenuBackgroundToken(createBackgroundToken());
    resetVisualPresentation();
  }, [
    currentUserBackgroundUri,
    draftSelectedUserBackgrounds,
    draftUserBackgrounds,
    resetVisualPresentation,
    syncBackgroundSelectionState,
  ]);

  const showFirstPassageForCurrentSelection = useCallback(() => {
    const firstPassage = pickNextPassage();

    if (!firstPassage) {
      setHistoryState(resetPassageHistory());
      resetVisualPresentation();
      return;
    }

    if (effectiveBackgroundMode === 'user' && appliedUserBackgrounds.length > 0) {
      const firstUserUri =
        appliedUserBackgrounds.length === 1
          ? appliedUserBackgrounds[0]
          : pickRandomUri(appliedUserBackgrounds, currentUserBackgroundUri) ??
            appliedUserBackgrounds[0];

      if (firstUserUri) {
        passageUserBackgroundUriMapRef.current[firstPassage.id] = firstUserUri;
        setCurrentUserBackgroundUri(firstUserUri);
      }
    } else {
      const nextBackgroundToken = createBackgroundToken();
      passageBackgroundMapRef.current[firstPassage.id] = nextBackgroundToken;
      setCurrentBackgroundToken(nextBackgroundToken);
    }

    setHistoryState(appendPassage(createInitialPassageHistoryState(), firstPassage));
    resetVisualPresentation();
  }, [
    appliedUserBackgrounds,
    currentUserBackgroundUri,
    effectiveBackgroundMode,
    pickNextPassage,
    resetVisualPresentation,
  ]);

  const showPreviousPassage = useCallback(() => {
    clearSingleTapTimer();
    setHistoryState((prev) => moveToPreviousPassage(prev));
    resetVisualPresentation();
  }, [clearSingleTapTimer, resetVisualPresentation]);

  const showNextPassage = useCallback(() => {
    clearSingleTapTimer();

    let nextBackgroundTokenToApply: string | null = null;
    let nextUserBackgroundUriToApply: string | null = null;

    setHistoryState((prev) => {
      if (canGoToNextSeenPassage(prev)) {
        return moveToNextSeenPassage(prev);
      }

      const excludeIds = prev.past.map((item) => item.id);
      const nextPassage = pickNextPassage(excludeIds);

      if (!nextPassage) {
        return prev;
      }

      if (effectiveBackgroundMode === 'user' && appliedUserBackgrounds.length > 0) {
        nextUserBackgroundUriToApply =
          appliedUserBackgrounds.length === 1
            ? appliedUserBackgrounds[0]
            : pickRandomUri(appliedUserBackgrounds, currentUserBackgroundUri) ??
              appliedUserBackgrounds[0];

        if (nextUserBackgroundUriToApply) {
          passageUserBackgroundUriMapRef.current[nextPassage.id] = nextUserBackgroundUriToApply;
        }
      } else {
        nextBackgroundTokenToApply = createBackgroundToken();
        passageBackgroundMapRef.current[nextPassage.id] = nextBackgroundTokenToApply;
      }

      return appendPassage(prev, nextPassage);
    });

    if (nextUserBackgroundUriToApply) {
      setCurrentUserBackgroundUri(nextUserBackgroundUriToApply);
    }

    if (nextBackgroundTokenToApply) {
      setCurrentBackgroundToken(nextBackgroundTokenToApply);
    }

    resetVisualPresentation();
  }, [
    appliedUserBackgrounds,
    clearSingleTapTimer,
    currentUserBackgroundUri,
    effectiveBackgroundMode,
    pickNextPassage,
    resetVisualPresentation,
  ]);

  const handleApply = useCallback((next: MenuSelectionState) => {
    if (!next.selectedCategories.length) {
      return;
    }

    if (!ALLOWED_LANGUAGES.includes(next.language)) {
      return;
    }

    const normalizedNext: MenuSelectionState = {
      ...next,
      selectedCategories: [...next.selectedCategories],
      background: effectiveBackgroundMode === 'user' ? 'upload' : 'auto',
    };

    clearSingleTapTimer();
    passageBackgroundMapRef.current = {};
    passageUserBackgroundUriMapRef.current = {};
    setMenuSelections(normalizedNext);
    setDraftSelections(normalizedNext);
    setHistoryState(resetPassageHistory());
    setShouldStartNewSelection(true);
    setOverlayMode('none');
    resetVisualPresentation();
  }, [clearSingleTapTimer, effectiveBackgroundMode, resetVisualPresentation]);

  const handleBackgroundReady = useCallback(() => {
    setBackgroundReady(true);
  }, []);

  useEffect(() => {
    if (!shouldStartNewSelection) {
      return;
    }

    if (isMenuVisible || isUserBackgroundManagerVisible) {
      return;
    }

    setShouldStartNewSelection(false);
    showFirstPassageForCurrentSelection();
  }, [
    shouldStartNewSelection,
    isMenuVisible,
    isUserBackgroundManagerVisible,
    showFirstPassageForCurrentSelection,
  ]);

  useEffect(() => {
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }

    if (
      !isBackgroundReady ||
      isMenuVisible ||
      isUserBackgroundManagerVisible ||
      !combinedText
    ) {
      setTextReady(false);
      setShowSource(false);
      return;
    }

    readyTimerRef.current = setTimeout(() => {
      setTextReady(true);
    }, TEXT_DELAY_MS);

    return () => {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    };
  }, [
    isBackgroundReady,
    isMenuVisible,
    isUserBackgroundManagerVisible,
    combinedText,
    currentPassage?.id,
  ]);

  useEffect(() => {
    setShowSource(false);
  }, [orientation]);

  useEffect(() => {
    if (isLandscape && isUserBackgroundManagerVisible) {
      setDraftUserBackgrounds([]);
      setDraftSelectedUserBackgrounds([]);
      setOverlayMode('menu');
      setMenuBackgroundToken(createBackgroundToken());
      resetVisualPresentation();
    }
  }, [isLandscape, isUserBackgroundManagerVisible, resetVisualPresentation]);

  useEffect(() => {
    if (!currentPassage?.id) {
      return;
    }

    if (effectiveBackgroundMode === 'user') {
      const mappedUserUri = passageUserBackgroundUriMapRef.current[currentPassage.id];

      if (mappedUserUri) {
        setCurrentUserBackgroundUri((prev) => (prev === mappedUserUri ? prev : mappedUserUri));
      }

      return;
    }

    const mappedBackgroundToken = passageBackgroundMapRef.current[currentPassage.id];
    if (!mappedBackgroundToken) {
      return;
    }

    setCurrentBackgroundToken((prev) =>
      prev === mappedBackgroundToken ? prev : mappedBackgroundToken,
    );
  }, [currentPassage?.id, effectiveBackgroundMode]);

  useEffect(() => {
    if (effectiveBackgroundMode === 'auto') {
      setCurrentUserBackgroundUri(null);
    } else if (appliedUserBackgrounds.length === 1) {
      setCurrentUserBackgroundUri(appliedUserBackgrounds[0]);
    } else if (appliedUserBackgrounds.length > 1 && !currentUserBackgroundUri) {
      setCurrentUserBackgroundUri(appliedUserBackgrounds[0]);
    }
  }, [appliedUserBackgrounds, currentUserBackgroundUri, effectiveBackgroundMode]);

  useEffect(() => {
    return () => {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
    };
  }, []);

  const displayedText = isTextReady && combinedText ? combinedText : '';

  const handleAdvanceByTap = useCallback(() => {
    if (!isGestureEnabled) {
      return;
    }

    const now = Date.now();
    const elapsed = now - lastTapTimestampRef.current;

    if (elapsed <= DOUBLE_TAP_DELAY_MS) {
      clearSingleTapTimer();
      lastTapTimestampRef.current = 0;

      if (canGoPrev) {
        showPreviousPassage();
      }

      return;
    }

    lastTapTimestampRef.current = now;
    clearSingleTapTimer();

    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      lastTapTimestampRef.current = 0;
      showNextPassage();
    }, DOUBLE_TAP_DELAY_MS);
  }, [canGoPrev, clearSingleTapTimer, isGestureEnabled, showNextPassage, showPreviousPassage]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isGestureEnabled,
        onStartShouldSetPanResponderCapture: () => isGestureEnabled,
        onMoveShouldSetPanResponder: (_evt, gestureState) => {
          if (!isGestureEnabled) {
            return false;
          }

          const absDx = Math.abs(gestureState.dx);
          const absDy = Math.abs(gestureState.dy);

          return absDx >= SWIPE_ACTIVATION_DISTANCE && absDx >= absDy * SWIPE_DIRECTION_RATIO;
        },
        onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
          if (!isGestureEnabled) {
            return false;
          }

          const absDx = Math.abs(gestureState.dx);
          const absDy = Math.abs(gestureState.dy);

          return absDx >= SWIPE_ACTIVATION_DISTANCE && absDx >= absDy * SWIPE_DIRECTION_RATIO;
        },
        onPanResponderGrant: () => {
          gestureHandledRef.current = false;
        },
        onPanResponderTerminationRequest: () => true,
        onPanResponderRelease: (_evt, gestureState) => {
          if (!isGestureEnabled || gestureHandledRef.current) {
            return;
          }

          const dx = gestureState.dx;
          const dy = gestureState.dy;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          const isTap = absDx <= TAP_MAX_DISTANCE && absDy <= TAP_MAX_DISTANCE;

          if (isTap) {
            gestureHandledRef.current = true;
            handleAdvanceByTap();
            return;
          }

          const isHorizontalSwipe =
            absDx >= SWIPE_TRIGGER_DISTANCE &&
            absDx >= absDy * SWIPE_DIRECTION_RATIO &&
            absDy <= SWIPE_MAX_VERTICAL_DRIFT;

          if (!isHorizontalSwipe) {
            return;
          }

          gestureHandledRef.current = true;
          clearSingleTapTimer();
          lastTapTimestampRef.current = 0;

          if (dx < 0) {
            showNextPassage();
            return;
          }

          if (dx > 0 && canGoPrev) {
            showPreviousPassage();
          }
        },
        onPanResponderTerminate: () => {
          gestureHandledRef.current = false;
        },
      }),
    [
      canGoPrev,
      clearSingleTapTimer,
      handleAdvanceByTap,
      isGestureEnabled,
      showNextPassage,
      showPreviousPassage,
    ],
  );

  return (
    <AdaptiveBackground
      key={activeBackgroundKey}
      onReady={handleBackgroundReady}
      blurRadius={isMenuVisible || isUserBackgroundManagerVisible ? MENU_BACKGROUND_BLUR_RADIUS : 0}
      backgroundMode={effectiveBackgroundMode}
      userBackgroundUri={currentUserBackgroundUri}
    >
      <View style={styles.root}>
        <View style={styles.gestureLayer} {...panResponder.panHandlers}>
          <View style={[styles.container, isLandscape && styles.containerLandscape]}>
            <View
              style={[
                styles.textBlock,
                isLandscape ? styles.textBlockLandscape : styles.textBlockPortrait,
              ]}
            >
              <AnimatedPassageText
                key={`passage-${orientation}-${currentPassage?.id ?? 'empty'}-${historyState.currentIndex}`}
                line={displayedText}
                containerStyle={styles.paragraphContainer}
                style={[styles.paragraph, paragraphFontStyle, { fontSize: bodyFontSize }]}
                isReady={isTextReady}
                onComplete={() => setShowSource(true)}
                variant={fontVariant}
              />

              {sourceReserveHeight > 0 ? (
                <View style={[styles.sourceReserve, { marginTop: 18, minHeight: sourceReserveHeight }]}>
                  {sourceText && showSource ? (
                    <PassageSourceText
                      text={sourceText}
                      baseFontSize={bodyFontSize}
                      variant={fontVariant}
                      style={paragraphFontStyle}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>

          <MenuSlideSheet
            visible={isMenuVisible}
            onClose={closeMenu}
            onApply={handleApply}
            state={draftSelections}
            onChange={setDraftSelections}
            hasPassages={hasPassages}
            onOpenUserBackgroundManager={handleOpenUserBackgroundManager}
            onSelectAutoBackground={handleSelectAutoBackground}
          />

          <UserBackgroundManagerSheet
            visible={isUserBackgroundManagerVisible}
            backgrounds={draftUserBackgrounds}
            selectedUris={draftSelectedUserBackgrounds}
            maxItems={MAX_USER_BACKGROUNDS}
            onToggleSelect={handleToggleUserBackgroundSelection}
            onAdd={handleAddUserBackgrounds}
            onDeleteSelected={handleDeleteSelectedUserBackgrounds}
            onApply={handleApplyUserBackgrounds}
            onClose={closeUserBackgroundManager}
          />
        </View>

        {!isMenuVisible && !isUserBackgroundManagerVisible ? (
          <BottomDotButton
            style={styles.bottomButton}
            onPress={() => {
              if (!isMenuButtonEnabled) {
                return;
              }
              openMenu();
            }}
            accessibilityLabel="Open menu"
          />
        ) : null}
      </View>
    </AdaptiveBackground>
  );
};
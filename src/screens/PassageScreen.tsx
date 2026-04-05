import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { AdaptiveBackground } from '../components/AdaptiveBackground';
import { AnimatedPassageText } from '../components/AnimatedPassageText';
import {
  PassageSourceText,
  buildSourceTypography,
  FontVariant,
} from '../components/PassageSourceText';
import { BottomDotButton } from '../components/BottomDotButton';
import { MenuSlideSheet } from '../components/MenuSlideSheet';
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
      return BASE_FONT_SIZE + 2;
    case 'handwriting':
      return BASE_FONT_SIZE + 8;
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
  const [isMenuVisible, setMenuVisible] = useState(initialMenuVisible);
  const [isBackgroundReady, setBackgroundReady] = useState(false);
  const [isTextReady, setTextReady] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [historyState, setHistoryState] = useState(createInitialPassageHistoryState());
  const [shouldStartNewSelection, setShouldStartNewSelection] = useState(false);
  const [currentBackgroundToken, setCurrentBackgroundToken] = useState<string>(() => createBackgroundToken());
  const [menuBackgroundToken, setMenuBackgroundToken] = useState<string>(() => createBackgroundToken());

  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimestampRef = useRef(0);
  const gestureHandledRef = useRef(false);
  const passageBackgroundMapRef = useRef<Record<string, string>>({});

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
  const isGestureEnabled = !isMenuVisible && isTextReady && showSource && hasCurrent;

  const activeBackgroundKey = isMenuVisible
    ? `menu-${menuBackgroundToken}`
    : `passage-${currentBackgroundToken}`;

  const resetTextPresentation = useCallback(() => {
    setTextReady(false);
    setShowSource(false);
  }, []);

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

  const openMenu = useCallback(() => {
    clearSingleTapTimer();
    setDraftSelections({
      ...menuSelections,
      selectedCategories: [...menuSelections.selectedCategories],
    });
    setMenuBackgroundToken(createBackgroundToken());
    setMenuVisible(true);
    resetVisualPresentation();
  }, [clearSingleTapTimer, menuSelections, resetVisualPresentation]);

  const closeMenu = useCallback(() => {
    clearSingleTapTimer();
    setMenuVisible(false);
    resetVisualPresentation();
  }, [clearSingleTapTimer, resetVisualPresentation]);

  const showFirstPassageForCurrentSelection = useCallback(() => {
    const firstPassage = pickNextPassage();

    if (!firstPassage) {
      setHistoryState(resetPassageHistory());
      resetVisualPresentation();
      return;
    }

    const nextBackgroundToken = createBackgroundToken();
    passageBackgroundMapRef.current[firstPassage.id] = nextBackgroundToken;
    setCurrentBackgroundToken(nextBackgroundToken);
    setHistoryState(appendPassage(createInitialPassageHistoryState(), firstPassage));
    resetVisualPresentation();
  }, [pickNextPassage, resetVisualPresentation]);

  const showPreviousPassage = useCallback(() => {
    clearSingleTapTimer();
    setHistoryState((prev) => moveToPreviousPassage(prev));
    resetVisualPresentation();
  }, [clearSingleTapTimer, resetVisualPresentation]);

  const showNextPassage = useCallback(() => {
    clearSingleTapTimer();

    let nextBackgroundTokenToApply: string | null = null;

    setHistoryState((prev) => {
      if (canGoToNextSeenPassage(prev)) {
        return moveToNextSeenPassage(prev);
      }

      const excludeIds = prev.past.map((item) => item.id);
      const nextPassage = pickNextPassage(excludeIds);

      if (!nextPassage) {
        return prev;
      }

      nextBackgroundTokenToApply = createBackgroundToken();
      passageBackgroundMapRef.current[nextPassage.id] = nextBackgroundTokenToApply;

      return appendPassage(prev, nextPassage);
    });

    if (nextBackgroundTokenToApply) {
      setCurrentBackgroundToken(nextBackgroundTokenToApply);
    }

    resetVisualPresentation();
  }, [clearSingleTapTimer, pickNextPassage, resetVisualPresentation]);

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
    };

    clearSingleTapTimer();
    passageBackgroundMapRef.current = {};
    setMenuSelections(normalizedNext);
    setDraftSelections(normalizedNext);
    setHistoryState(resetPassageHistory());
    setShouldStartNewSelection(true);
    setMenuVisible(false);
    resetVisualPresentation();
  }, [clearSingleTapTimer, resetVisualPresentation]);

  const handleBackgroundReady = useCallback(() => {
    setBackgroundReady(true);
  }, []);

  useEffect(() => {
    if (!shouldStartNewSelection) {
      return;
    }

    if (isMenuVisible) {
      return;
    }

    setShouldStartNewSelection(false);
    showFirstPassageForCurrentSelection();
  }, [shouldStartNewSelection, isMenuVisible, showFirstPassageForCurrentSelection]);

  useEffect(() => {
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }

    if (!isBackgroundReady || isMenuVisible || !combinedText) {
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
  }, [isBackgroundReady, isMenuVisible, combinedText, currentPassage?.id]);

  useEffect(() => {
    setShowSource(false);
  }, [orientation]);

  useEffect(() => {
    if (!currentPassage?.id) {
      return;
    }

    const mappedBackgroundToken = passageBackgroundMapRef.current[currentPassage.id];
    if (!mappedBackgroundToken) {
      return;
    }

    setCurrentBackgroundToken((prev) =>
      prev === mappedBackgroundToken ? prev : mappedBackgroundToken,
    );
  }, [currentPassage?.id]);

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
      blurRadius={isMenuVisible ? MENU_BACKGROUND_BLUR_RADIUS : 0}
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
          />
        </View>

        {!isMenuVisible ? (
          <BottomDotButton
            style={styles.bottomButton}
            onPress={openMenu}
            accessibilityLabel="Open menu"
          />
        ) : null}
      </View>
    </AdaptiveBackground>
  );
};
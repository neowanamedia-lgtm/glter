import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
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

import { UserMyWritingManager } from '../ux/layers/UserMyWritingManager';
import { UserMyWritingEditor } from '../ux/layers/UserMyWritingEditor';

import { loadMyWritings, saveMyWritings } from '../storage/myWritingStorage';
import type { MyWriting } from '../types/myWriting';
import { MAX_MY_WRITINGS, createMyWriting, updateMyWritingBody } from '../types/myWriting';
import { usePassage } from '../hooks/usePassage';
import { useOrientation } from '../hooks/useOrientation';
import {
  createFilterStateFromCategories,
  type FilterSelectionState,
} from '../constants/filterSchema';
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
import {
  BackgroundConfig,
  getBackgroundAt,
  getNextBackgroundIndex,
  getRandomBackgroundIndex,
} from '../constants/backgrounds';

const TEXT_DELAY_MS = 0;
const BASE_FONT_SIZE = 20;
const SOURCE_CHARS_PER_LINE = 14;
const ALLOWED_LANGUAGES: Array<MenuSelectionState['language']> = ['ko', 'en'];

const TAP_MAX_DISTANCE = 40;
const SWIPE_ACTIVATION_DISTANCE = 6;
const SWIPE_TRIGGER_DISTANCE = 18;
const SWIPE_DIRECTION_RATIO = 0.85;
const SWIPE_MAX_VERTICAL_DRIFT = 180;
const MENU_BACKGROUND_BLUR_RADIUS = 28;
const DOUBLE_TAP_DELAY_MS = 360;
const MAX_USER_BACKGROUNDS = 30;

type BackgroundMode = 'auto' | 'user';
type OverlayMode = 'none' | 'menu' | 'userBackgroundManager' | 'userMyWritingManager';

type FavoritePassage = {
  id: string;
  lines: string[];
  sourceText?: string;
};

type DisplayPassage = {
  id: string;
  lines: string[];
  sourceText?: string;
};

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
      return BASE_FONT_SIZE + 11;
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

const dedupeIds = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const next: string[] = [];

  ids.forEach((id) => {
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    next.push(id);
  });

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
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  containerPortrait: {
    justifyContent: 'flex-start',
  },
  containerLandscape: {
    justifyContent: 'flex-start',
  },
  textBlock: {
    position: 'absolute',
    width: '86%',
    maxWidth: 560,
    paddingHorizontal: 8,
  },
  textBlockPortrait: {
    width: '86%',
    maxWidth: 560,
  },
  textBlockLandscape: {
    width: '92%',
    maxWidth: 860,
  },
  textMeasure: {
    width: '100%',
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
  myWritingScrollViewport: {
    width: '100%',
  },
  myWritingScrollContent: {
    paddingBottom: 12,
  },
  myWritingSourceWrap: {
    marginTop: 18,
  },
  heartBottomButton: {
    position: 'absolute',
    left: 28,
    bottom: 24,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    opacity: 0.97,
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
  favoritePassages: FavoritePassage[];
  setFavoritePassages: React.Dispatch<React.SetStateAction<FavoritePassage[]>>;
};

export const PassageScreen: React.FC<PassageScreenProps> = ({
  onExitService: _onExitService,
  initialMenuVisible = true,
  fontsLoaded,
  favoritePassages,
  setFavoritePassages,
}) => {
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';
  const { height: windowHeight } = useWindowDimensions();

  const [menuSelections, setMenuSelections] = useState<MenuSelectionState>(INITIAL_MENU_SELECTIONS);
  const [draftSelections, setDraftSelections] = useState<MenuSelectionState>(INITIAL_MENU_SELECTIONS);
  const [filterSelections, setFilterSelections] = useState<FilterSelectionState>(() =>
    createFilterStateFromCategories(INITIAL_MENU_SELECTIONS.selectedCategories),
  );
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(initialMenuVisible ? 'menu' : 'none');
  const [isFavoritePassageMode, setFavoritePassageMode] = useState(false);
  const [draftIsFavoritePassageMode, setDraftFavoritePassageMode] = useState(false);

  const [isBackgroundReady, setBackgroundReady] = useState(true);
  const [isTextReady, setTextReady] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [historyState, setHistoryState] = useState(createInitialPassageHistoryState());
  const [shouldStartNewSelection, setShouldStartNewSelection] = useState(false);

  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('auto');

  const [autoBackgroundIndex, setAutoBackgroundIndex] = useState<number>(() =>
    getRandomBackgroundIndex(),
  );

  const [storedUserBackgrounds, setStoredUserBackgrounds] = useState<string[]>([]);
  const [appliedUserBackgrounds, setAppliedUserBackgrounds] = useState<string[]>([]);
  const [currentUserBackgroundUri, setCurrentUserBackgroundUri] = useState<string | null>(null);

  const [draftUserBackgrounds, setDraftUserBackgrounds] = useState<string[]>([]);
  const [draftSelectedUserBackgrounds, setDraftSelectedUserBackgrounds] = useState<string[]>([]);

  const [storedMyWritings, setStoredMyWritings] = useState<MyWriting[]>([]);
  const [appliedMyWritingIds, setAppliedMyWritingIds] = useState<string[]>([]);
  const [draftMyWritings, setDraftMyWritings] = useState<MyWriting[]>([]);
  const [draftSelectedMyWritingIds, setDraftSelectedMyWritingIds] = useState<string[]>([]);
  const [isMyWritingEditorVisible, setMyWritingEditorVisible] = useState(false);
  const [myWritingEditorMode, setMyWritingEditorMode] = useState<'create' | 'edit'>('create');
  const [myWritingEditorInitialBody, setMyWritingEditorInitialBody] = useState('');
  const [editingMyWritingId, setEditingMyWritingId] = useState<string | null>(null);

  const [textContentHeight, setTextContentHeight] = useState(0);

  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimestampRef = useRef(0);
  const gestureHandledRef = useRef(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const autoBackgroundIndexRef = useRef(autoBackgroundIndex);
  const currentUserBackgroundUriRef = useRef<string | null>(currentUserBackgroundUri);
  const displayedPassageIndexRef = useRef(0);

  const passageBackgroundIndexMapRef = useRef<Record<string, number>>({});
  const passageUserBackgroundUriMapRef = useRef<Record<string, string>>({});
  const myWritingLoadedRef = useRef(false);

  const isMenuVisible = overlayMode === 'menu';
  const isUserBackgroundManagerVisible = overlayMode === 'userBackgroundManager';
  const isUserMyWritingManagerVisible = overlayMode === 'userMyWritingManager';

  const effectiveBackgroundMode: 'auto' | 'user' = useMemo(() => {
    if (backgroundMode === 'user' && appliedUserBackgrounds.length > 0) {
      return 'user';
    }

    return 'auto';
  }, [appliedUserBackgrounds.length, backgroundMode]);

  const fontVariant = useMemo(() => getFontVariant(menuSelections.font), [menuSelections.font]);

  const paragraphFontStyle = useMemo(
    () => getParagraphFontStyle(fontsLoaded, fontVariant),
    [fontsLoaded, fontVariant],
  );

  const bodyFontSize = useMemo(() => getBodyFontSize(fontVariant), [fontVariant]);

  const isMyWritingPassageMode = menuSelections.includeMyWriting;

  const { hasPassages, pickNextPassage } = usePassage({
    language: menuSelections.language,
    emotion: menuSelections.emotion,
    filters: filterSelections,
    includeMyWriting: menuSelections.includeMyWriting,
    myWritings: storedMyWritings,
  });

  const currentPassage = useMemo<DisplayPassage | null>(
    () => (getCurrentPassage(historyState) as DisplayPassage | null),
    [historyState],
  );
  const [displayedPassage, setDisplayedPassage] = useState<DisplayPassage | null>(null);
  const [displayedAutoBackgroundIndex, setDisplayedAutoBackgroundIndex] = useState<number>(() =>
    autoBackgroundIndex,
  );
  const [displayedUserBackgroundUri, setDisplayedUserBackgroundUri] = useState<string | null>(null);

  const combinedText = useMemo(
    () => (displayedPassage ? displayedPassage.lines.join('\n').trim() : ''),
    [displayedPassage],
  );

  const sourceText = useMemo(() => displayedPassage?.sourceText ?? '', [displayedPassage]);

  const sourceReserveHeight = useMemo(
    () => estimateSourceHeight(sourceText, bodyFontSize, fontVariant),
    [sourceText, bodyFontSize, fontVariant],
  );

  const hasCurrent = Boolean(displayedPassage);
  const canGoPrev = canGoToPreviousPassage(historyState);

  const passageTransitionToken = useMemo(
    () => `${displayedPassage?.id ?? 'none'}:${displayedPassageIndexRef.current}`,
    [displayedPassage?.id],
  );

  const isGestureEnabled =
    !isMenuVisible &&
    !isUserBackgroundManagerVisible &&
    !isUserMyWritingManagerVisible &&
    isTextReady &&
    showSource &&
    hasCurrent;

  const isOverlayVisible =
    isMenuVisible || isUserBackgroundManagerVisible || isUserMyWritingManagerVisible;

  const isMenuButtonEnabled = !isOverlayVisible && showSource && hasCurrent;

  const activeAutoBackground: BackgroundConfig = useMemo(
    () => getBackgroundAt(displayedAutoBackgroundIndex),
    [displayedAutoBackgroundIndex],
  );

  const currentSceneAutoBackgroundIndex = useMemo(() => {
    if (!currentPassage?.id) {
      return autoBackgroundIndex;
    }

    const mappedBackgroundIndex = passageBackgroundIndexMapRef.current[currentPassage.id];
    return typeof mappedBackgroundIndex === 'number' ? mappedBackgroundIndex : autoBackgroundIndex;
  }, [autoBackgroundIndex, currentPassage?.id]);

  const currentSceneUserBackgroundUri = useMemo(() => {
    if (!currentPassage?.id) {
      return currentUserBackgroundUri;
    }

    return passageUserBackgroundUriMapRef.current[currentPassage.id] ?? currentUserBackgroundUri;
  }, [currentPassage?.id, currentUserBackgroundUri]);

  const activeDisplayedBackgroundKey = useMemo(() => {
    return effectiveBackgroundMode === 'user'
      ? `user:${displayedUserBackgroundUri ?? 'none'}`
      : `auto:${displayedAutoBackgroundIndex}`;
  }, [displayedAutoBackgroundIndex, displayedUserBackgroundUri, effectiveBackgroundMode]);

  const textTopPadding = isLandscape ? 72 : 112;
  const textBottomPadding = isLandscape ? 84 : 132;

  const scrollViewportHeight = useMemo(() => {
    const available = windowHeight - textTopPadding - textBottomPadding;
    return Math.max(isLandscape ? 180 : 220, available);
  }, [isLandscape, textBottomPadding, textTopPadding, windowHeight]);

  const dynamicTextTop = useMemo(() => {
    if (isMyWritingPassageMode) {
      return textTopPadding;
    }

    if (isLandscape) {
      return textTopPadding;
    }

    if (!isTextReady || !textContentHeight || windowHeight <= 0) {
      return textTopPadding;
    }

    const minTop = 158;
    const maxTop = 250;
    const availableHeight = Math.max(0, windowHeight - textBottomPadding);
    const centeredTop = Math.round((availableHeight - textContentHeight) / 2 + 38);

    return Math.max(minTop, Math.min(maxTop, centeredTop));
  }, [
    isLandscape,
    isMyWritingPassageMode,
    isTextReady,
    textContentHeight,
    textBottomPadding,
    textTopPadding,
    windowHeight,
  ]);

  const resetVisualPresentation = useCallback(() => {
    setTextReady(false);
    setShowSource(false);
  }, []);

  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }, []);

  const animateHeart = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.18,
        useNativeDriver: true,
        speed: 30,
        bounciness: 10,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 26,
        bounciness: 8,
      }),
    ]).start();
  }, [heartScale]);

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

  const pickNextFavoritePassage = useCallback(
    (excludeIds: string[] = []): DisplayPassage | null => {
      if (!favoritePassages.length) {
        return null;
      }

      const excludeSet = new Set(excludeIds);
      const pool = favoritePassages.filter((item) => !excludeSet.has(item.id));

      if (!pool.length) {
        return favoritePassages[0] ?? null;
      }

      const index = Math.floor(Math.random() * pool.length);
      return pool[index] ?? pool[0] ?? null;
    },
    [favoritePassages],
  );

  const isFavorite = useMemo(() => {
    if (!currentPassage?.id) {
      return false;
    }

    return favoritePassages.some((item) => item.id === currentPassage.id);
  }, [currentPassage?.id, favoritePassages]);

  const toggleFavorite = useCallback(() => {
    if (!currentPassage?.id) {
      return;
    }

    animateHeart();

    const nextItem: FavoritePassage = {
      id: currentPassage.id,
      lines: [...currentPassage.lines],
      sourceText: currentPassage.sourceText ?? '',
    };

    setFavoritePassages((prev) => {
      const exists = prev.some((item) => item.id === currentPassage.id);

      if (exists) {
        const next = prev.filter((item) => item.id !== currentPassage.id);

        if (isFavoritePassageMode && next.length === 0) {
          setFavoritePassageMode(false);
          setDraftFavoritePassageMode(false);
          setOverlayMode('menu');
          resetVisualPresentation();
        }

        return next;
      }

      return [nextItem, ...prev];
    });
  }, [
    animateHeart,
    currentPassage,
    isFavoritePassageMode,
    resetVisualPresentation,
    setFavoritePassages,
  ]);

  const openMenu = useCallback(() => {
    clearSingleTapTimer();
    setDraftSelections({
      ...menuSelections,
      selectedCategories: [...menuSelections.selectedCategories],
      background: backgroundMode === 'user' ? 'upload' : 'auto',
    });
    setDraftFavoritePassageMode(isFavoritePassageMode);
    setOverlayMode('menu');
    resetVisualPresentation();
  }, [
    backgroundMode,
    clearSingleTapTimer,
    isFavoritePassageMode,
    menuSelections,
    resetVisualPresentation,
  ]);

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
    currentUserBackgroundUriRef.current = null;
    syncBackgroundSelectionState('auto');
    resetVisualPresentation();
  }, [resetVisualPresentation, syncBackgroundSelectionState]);

  const closeUserBackgroundManager = useCallback(() => {
    setDraftUserBackgrounds([]);
    setDraftSelectedUserBackgrounds([]);
    setOverlayMode('menu');
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
        : pickRandomUri(confirmedSelection, currentUserBackgroundUriRef.current) ??
          confirmedSelection[0];

    setStoredUserBackgrounds(confirmedLibrary);
    setAppliedUserBackgrounds(confirmedSelection);
    setCurrentUserBackgroundUri(nextCurrentUri);
    currentUserBackgroundUriRef.current = nextCurrentUri;
    setBackgroundMode('user');
    syncBackgroundSelectionState('upload');
    passageUserBackgroundUriMapRef.current = {};
    setDraftUserBackgrounds([]);
    setDraftSelectedUserBackgrounds([]);
    setOverlayMode('menu');
    resetVisualPresentation();
  }, [
    draftSelectedUserBackgrounds,
    draftUserBackgrounds,
    resetVisualPresentation,
    syncBackgroundSelectionState,
  ]);

  const openUserMyWritingManager = useCallback((): boolean => {
    if (isLandscape) {
      return false;
    }

    const baseSelection =
      appliedMyWritingIds.length > 0
        ? appliedMyWritingIds
        : storedMyWritings.filter((writing) => writing.active).map((writing) => writing.id);

    const trimmed = storedMyWritings.slice(0, MAX_MY_WRITINGS);
    const trimmedIds = new Set(trimmed.map((writing) => writing.id));

    setDraftMyWritings(trimmed.map((writing) => ({ ...writing })));
    setDraftSelectedMyWritingIds(
      dedupeIds(baseSelection.filter((id) => trimmedIds.has(id))).slice(0, MAX_MY_WRITINGS),
    );
    setOverlayMode('userMyWritingManager');
    resetVisualPresentation();
    return true;
  }, [appliedMyWritingIds, isLandscape, resetVisualPresentation, storedMyWritings]);

  const handleOpenUserMyWritingManager = useCallback(async (): Promise<boolean> => {
    clearSingleTapTimer();
    return openUserMyWritingManager();
  }, [clearSingleTapTimer, openUserMyWritingManager]);

  const closeUserMyWritingManager = useCallback(() => {
    setDraftMyWritings([]);
    setDraftSelectedMyWritingIds([]);
    setOverlayMode('menu');
    setMyWritingEditorVisible(false);
    setEditingMyWritingId(null);
    resetVisualPresentation();
  }, [resetVisualPresentation]);

  const handleToggleDraftMyWritingSelection = useCallback((id: string) => {
    setDraftSelectedMyWritingIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }, []);

  const handleDeleteSelectedMyWritings = useCallback(() => {
    if (!draftSelectedMyWritingIds.length) {
      return;
    }

    const selectedSet = new Set(draftSelectedMyWritingIds);
    setDraftMyWritings((prev) => prev.filter((writing) => !selectedSet.has(writing.id)));
    setDraftSelectedMyWritingIds([]);
  }, [draftSelectedMyWritingIds]);

  const handleAddMyWriting = useCallback(() => {
    if (draftMyWritings.length >= MAX_MY_WRITINGS) {
      return;
    }

    setEditingMyWritingId(null);
    setMyWritingEditorMode('create');
    setMyWritingEditorInitialBody('');
    setMyWritingEditorVisible(true);
  }, [draftMyWritings.length]);

  const handleEditMyWriting = useCallback((writing: MyWriting) => {
    setEditingMyWritingId(writing.id);
    setMyWritingEditorMode('edit');
    setMyWritingEditorInitialBody(writing.body);
    setMyWritingEditorVisible(true);
  }, []);

  const handleMyWritingEditorCancel = useCallback(() => {
    setMyWritingEditorVisible(false);
    setEditingMyWritingId(null);
  }, []);

  const handleMyWritingEditorApply = useCallback(
    (body: string) => {
      if (myWritingEditorMode === 'create') {
        if (draftMyWritings.length >= MAX_MY_WRITINGS) {
          setMyWritingEditorVisible(false);
          setEditingMyWritingId(null);
          return;
        }

        const newWriting = createMyWriting(body);
        setDraftMyWritings((prev) => [newWriting, ...prev].slice(0, MAX_MY_WRITINGS));
        setDraftSelectedMyWritingIds((prev) =>
          dedupeIds([newWriting.id, ...prev]).slice(0, MAX_MY_WRITINGS),
        );
      } else if (editingMyWritingId) {
        setDraftMyWritings((prev) =>
          prev.map((writing) =>
            writing.id === editingMyWritingId ? updateMyWritingBody(writing, body) : writing,
          ),
        );
      }

      setMyWritingEditorVisible(false);
      setEditingMyWritingId(null);
    },
    [draftMyWritings.length, editingMyWritingId, myWritingEditorMode],
  );

  const handleMyWritingEditorDelete = useCallback(() => {
    if (!editingMyWritingId) {
      return;
    }

    setDraftMyWritings((prev) => prev.filter((writing) => writing.id !== editingMyWritingId));
    setDraftSelectedMyWritingIds((prev) => prev.filter((id) => id !== editingMyWritingId));
    setMyWritingEditorVisible(false);
    setEditingMyWritingId(null);
  }, [editingMyWritingId]);

  const handleApplyMyWritings = useCallback(() => {
    const confirmedLibrary = draftMyWritings.slice(0, MAX_MY_WRITINGS);
    const validSelection = dedupeIds(
      draftSelectedMyWritingIds.filter((id) =>
        confirmedLibrary.some((writing) => writing.id === id),
      ),
    ).slice(0, MAX_MY_WRITINGS);

    if (!validSelection.length) {
      return;
    }

    const nextLibrary = confirmedLibrary.map((writing) => ({
      ...writing,
      active: validSelection.includes(writing.id),
    }));

    setStoredMyWritings(nextLibrary);
    setAppliedMyWritingIds(validSelection);

    setDraftSelections((prev) => ({
      ...prev,
      includeMyWriting: true,
    }));
    setDraftFavoritePassageMode(false);

    setDraftMyWritings([]);
    setDraftSelectedMyWritingIds([]);
    setOverlayMode('menu');
    resetVisualPresentation();
  }, [draftMyWritings, draftSelectedMyWritingIds, resetVisualPresentation]);

  const showFirstPassageForCurrentSelection = useCallback(() => {
    const firstPassage = isFavoritePassageMode ? pickNextFavoritePassage() : pickNextPassage();

    if (!firstPassage) {
      setHistoryState(resetPassageHistory());
      resetVisualPresentation();
      return;
    }

    if (effectiveBackgroundMode === 'user' && appliedUserBackgrounds.length > 0) {
      const firstUserUri =
        appliedUserBackgrounds.length === 1
          ? appliedUserBackgrounds[0]
          : pickRandomUri(appliedUserBackgrounds, currentUserBackgroundUriRef.current) ??
            appliedUserBackgrounds[0];

      if (firstUserUri) {
        passageUserBackgroundUriMapRef.current[firstPassage.id] = firstUserUri;
        setCurrentUserBackgroundUri(firstUserUri);
        currentUserBackgroundUriRef.current = firstUserUri;
      }
    } else {
      const initialIndex = autoBackgroundIndexRef.current;
      passageBackgroundIndexMapRef.current[firstPassage.id] = initialIndex;
      setAutoBackgroundIndex(initialIndex);
    }

    setHistoryState(appendPassage(createInitialPassageHistoryState(), firstPassage as never));
    resetVisualPresentation();
  }, [
    appliedUserBackgrounds,
    effectiveBackgroundMode,
    isFavoritePassageMode,
    pickNextFavoritePassage,
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

    setHistoryState((prev) => {
      if (canGoToNextSeenPassage(prev)) {
        return moveToNextSeenPassage(prev);
      }

      const excludeIds = prev.past.map((item) => item.id);
      const nextPassage = isFavoritePassageMode
        ? pickNextFavoritePassage(excludeIds)
        : pickNextPassage(excludeIds);

      if (!nextPassage) {
        return prev;
      }

      if (effectiveBackgroundMode === 'user' && appliedUserBackgrounds.length > 0) {
        const nextUserBackgroundUri =
          appliedUserBackgrounds.length === 1
            ? appliedUserBackgrounds[0]
            : pickRandomUri(appliedUserBackgrounds, currentUserBackgroundUriRef.current) ??
              appliedUserBackgrounds[0];

        if (nextUserBackgroundUri) {
          passageUserBackgroundUriMapRef.current[nextPassage.id] = nextUserBackgroundUri;
        }
      } else {
        const currentResolvedIndex =
          (currentPassage?.id && passageBackgroundIndexMapRef.current[currentPassage.id]) ??
          autoBackgroundIndexRef.current;

        const nextBackgroundIndex = getNextBackgroundIndex(currentResolvedIndex);
        passageBackgroundIndexMapRef.current[nextPassage.id] = nextBackgroundIndex;
      }

      return appendPassage(prev, nextPassage as never);
    });

    resetVisualPresentation();
  }, [
    appliedUserBackgrounds,
    clearSingleTapTimer,
    currentPassage?.id,
    effectiveBackgroundMode,
    isFavoritePassageMode,
    pickNextFavoritePassage,
    pickNextPassage,
    resetVisualPresentation,
  ]);

  const handleApply = useCallback(
    (next: MenuSelectionState) => {
      const wantsFavorites = draftIsFavoritePassageMode;

      if (!wantsFavorites && !next.selectedCategories.length && !next.includeMyWriting) {
        return;
      }

      if (wantsFavorites && favoritePassages.length === 0) {
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
      passageBackgroundIndexMapRef.current = {};
      passageUserBackgroundUriMapRef.current = {};
      const nextFilters = createFilterStateFromCategories(normalizedNext.selectedCategories);

      setMenuSelections(normalizedNext);
      setDraftSelections(normalizedNext);
      setFilterSelections(nextFilters);
      setFavoritePassageMode(wantsFavorites);
      setDraftFavoritePassageMode(wantsFavorites);
      setHistoryState(resetPassageHistory());
      setShouldStartNewSelection(true);
      setOverlayMode('none');
      resetVisualPresentation();
    },
    [
      clearSingleTapTimer,
      draftIsFavoritePassageMode,
      effectiveBackgroundMode,
      favoritePassages.length,
      resetVisualPresentation,
    ],
  );

  const handleBackgroundReady = useCallback(() => {
    setBackgroundReady(true);
  }, []);

  useEffect(() => {
    if (!currentPassage) {
      setDisplayedPassage(null);
      setDisplayedAutoBackgroundIndex(autoBackgroundIndexRef.current);
      setDisplayedUserBackgroundUri(currentUserBackgroundUriRef.current);
      displayedPassageIndexRef.current = historyState.currentIndex;
      return;
    }

    if (!displayedPassage) {
      setDisplayedPassage(currentPassage);
      setDisplayedAutoBackgroundIndex(currentSceneAutoBackgroundIndex);
      setDisplayedUserBackgroundUri(currentSceneUserBackgroundUri);
      displayedPassageIndexRef.current = historyState.currentIndex;
      return;
    }

    const samePassage = displayedPassage.id === currentPassage.id;
    const sameBackground =
      activeDisplayedBackgroundKey ===
      (effectiveBackgroundMode === 'user'
        ? `user:${currentSceneUserBackgroundUri ?? 'none'}`
        : `auto:${currentSceneAutoBackgroundIndex}`);

    if (samePassage && sameBackground) {
      displayedPassageIndexRef.current = historyState.currentIndex;
      return;
    }

    setDisplayedPassage(currentPassage);
    setDisplayedAutoBackgroundIndex(currentSceneAutoBackgroundIndex);
    setDisplayedUserBackgroundUri(currentSceneUserBackgroundUri);
    displayedPassageIndexRef.current = historyState.currentIndex;
    setTextReady(false);
    setShowSource(false);
  }, [
    activeDisplayedBackgroundKey,
    currentPassage,
    currentSceneAutoBackgroundIndex,
    currentSceneUserBackgroundUri,
    displayedPassage,
    effectiveBackgroundMode,
    historyState.currentIndex,
  ]);

  useEffect(() => {
    autoBackgroundIndexRef.current = autoBackgroundIndex;
  }, [autoBackgroundIndex]);

  useEffect(() => {
    currentUserBackgroundUriRef.current = currentUserBackgroundUri;
  }, [currentUserBackgroundUri]);

  useEffect(() => {
    if (myWritingLoadedRef.current) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stored = await loadMyWritings();
        if (cancelled) {
          return;
        }

        myWritingLoadedRef.current = true;
        setStoredMyWritings(stored);
        setAppliedMyWritingIds(
          stored.filter((writing) => writing.active).map((writing) => writing.id),
        );
      } catch (error) {
        console.warn('[PassageScreen] Failed to load my writings', error);
        myWritingLoadedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!myWritingLoadedRef.current) {
      return;
    }

    (async () => {
      try {
        await saveMyWritings(storedMyWritings);
      } catch (error) {
        console.warn('[PassageScreen] Failed to save my writings', error);
      }
    })();
  }, [storedMyWritings]);

  useEffect(() => {
    if (!myWritingLoadedRef.current) {
      return;
    }

    if (storedMyWritings.length > 0) {
      return;
    }

    setAppliedMyWritingIds([]);
    setMenuSelections((prev) =>
      prev.includeMyWriting ? { ...prev, includeMyWriting: false } : prev,
    );
    setDraftSelections((prev) =>
      prev.includeMyWriting ? { ...prev, includeMyWriting: false } : prev,
    );
  }, [storedMyWritings.length]);

  useEffect(() => {
    if (favoritePassages.length > 0) {
      return;
    }

    if (isFavoritePassageMode) {
      setFavoritePassageMode(false);
      setDraftFavoritePassageMode(false);
      setOverlayMode('menu');
      resetVisualPresentation();
      return;
    }

    setDraftFavoritePassageMode(false);
  }, [favoritePassages.length, isFavoritePassageMode, resetVisualPresentation]);

  useEffect(() => {
    if (!shouldStartNewSelection) {
      return;
    }

    if (isMenuVisible || isUserBackgroundManagerVisible || isUserMyWritingManagerVisible) {
      return;
    }

    setShouldStartNewSelection(false);
    showFirstPassageForCurrentSelection();
  }, [
    shouldStartNewSelection,
    isMenuVisible,
    isUserBackgroundManagerVisible,
    isUserMyWritingManagerVisible,
    showFirstPassageForCurrentSelection,
  ]);

  useEffect(() => {
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }

    if (
      !combinedText ||
      isMenuVisible ||
      isUserBackgroundManagerVisible ||
      isUserMyWritingManagerVisible
    ) {
      setTextReady(false);
      setShowSource(false);
      return;
    }

    readyTimerRef.current = setTimeout(() => {
      setTextReady(true);
      setBackgroundReady(true);
    }, TEXT_DELAY_MS);

    return () => {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    };
  }, [
    combinedText,
    isMenuVisible,
    isUserBackgroundManagerVisible,
    isUserMyWritingManagerVisible,
    sourceText,
    historyState.currentIndex,
  ]);


  useEffect(() => {
    if (isLandscape && isUserBackgroundManagerVisible) {
      setDraftUserBackgrounds([]);
      setDraftSelectedUserBackgrounds([]);
      setOverlayMode('menu');
      resetVisualPresentation();
    }

    if (isLandscape && isUserMyWritingManagerVisible) {
      setDraftMyWritings([]);
      setDraftSelectedMyWritingIds([]);
      setOverlayMode('menu');
      setMyWritingEditorVisible(false);
      setEditingMyWritingId(null);
      resetVisualPresentation();
    }
  }, [
    isLandscape,
    isUserBackgroundManagerVisible,
    isUserMyWritingManagerVisible,
    resetVisualPresentation,
  ]);

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

    const mappedBackgroundIndex = passageBackgroundIndexMapRef.current[currentPassage.id];
    if (typeof mappedBackgroundIndex !== 'number') {
      return;
    }

    setAutoBackgroundIndex((prev) =>
      prev === mappedBackgroundIndex ? prev : mappedBackgroundIndex,
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

  const displayedText = combinedText;

  const handleAdvanceByTap = useCallback(() => {
    if (!isGestureEnabled || isMyWritingPassageMode) {
      return;
    }

    const now = Date.now();
    const elapsed = now - lastTapTimestampRef.current;

    if (elapsed > 0 && elapsed <= DOUBLE_TAP_DELAY_MS) {
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
  }, [
    canGoPrev,
    clearSingleTapTimer,
    isGestureEnabled,
    isMyWritingPassageMode,
    showNextPassage,
    showPreviousPassage,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isGestureEnabled && !isMyWritingPassageMode,
        onStartShouldSetPanResponderCapture: () => isGestureEnabled && !isMyWritingPassageMode,
        onMoveShouldSetPanResponder: (_evt, gestureState) => {
          if (!isGestureEnabled) {
            return false;
          }

          const absDx = Math.abs(gestureState.dx);
          const absDy = Math.abs(gestureState.dy);

          if (isMyWritingPassageMode) {
            return false;
          }

          return absDx >= SWIPE_ACTIVATION_DISTANCE && absDx >= absDy * SWIPE_DIRECTION_RATIO;
        },
        onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
          if (!isGestureEnabled) {
            return false;
          }

          const absDx = Math.abs(gestureState.dx);
          const absDy = Math.abs(gestureState.dy);

          if (isMyWritingPassageMode) {
            return (
              absDx >= SWIPE_ACTIVATION_DISTANCE &&
              absDx > absDy * SWIPE_DIRECTION_RATIO &&
              absDy <= SWIPE_MAX_VERTICAL_DRIFT
            );
          }

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

          const isHorizontalSwipe =
            absDx >= SWIPE_TRIGGER_DISTANCE &&
            absDx > absDy * SWIPE_DIRECTION_RATIO &&
            absDy <= SWIPE_MAX_VERTICAL_DRIFT;

          if (isHorizontalSwipe) {
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
            return;
          }

          if (!isMyWritingPassageMode) {
            const isTap = absDx <= TAP_MAX_DISTANCE && absDy <= TAP_MAX_DISTANCE;

            if (isTap) {
              gestureHandledRef.current = true;
              handleAdvanceByTap();
            }
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
      isMyWritingPassageMode,
      showNextPassage,
      showPreviousPassage,
    ],
  );

  return (
    <Animated.View style={styles.root}>
      <AdaptiveBackground
        onReady={handleBackgroundReady}
        blurRadius={
          isMenuVisible || isUserBackgroundManagerVisible || isUserMyWritingManagerVisible
            ? MENU_BACKGROUND_BLUR_RADIUS
            : 0
        }
        backgroundMode={effectiveBackgroundMode}
        userBackgroundUri={displayedUserBackgroundUri}
        background={activeAutoBackground}
        backgroundKey={activeDisplayedBackgroundKey}
      >
        <View style={styles.root}>
          <View style={styles.gestureLayer} {...panResponder.panHandlers}>
            <View
              style={[
                styles.container,
                isLandscape ? styles.containerLandscape : styles.containerPortrait,
              ]}
            >
              {!isMenuVisible && !isUserBackgroundManagerVisible && !isUserMyWritingManagerVisible ? (
                <View
                  style={[
                    styles.textBlock,
                    isLandscape ? styles.textBlockLandscape : styles.textBlockPortrait,
                    { top: dynamicTextTop },
                  ]}
                >
                  <View
                    style={styles.textMeasure}
                    onLayout={
                      isMyWritingPassageMode
                        ? undefined
                        : (event) => {
                            const measuredHeight = Math.ceil(event.nativeEvent.layout.height);
                            setTextContentHeight((prev) =>
                              prev === measuredHeight ? prev : measuredHeight,
                            );
                          }
                    }
                  >
                    {isMyWritingPassageMode ? (
                      <ScrollView
                        style={[
                          styles.myWritingScrollViewport,
                          isLandscape
                            ? { height: scrollViewportHeight }
                            : { maxHeight: scrollViewportHeight },
                        ]}
                        contentContainerStyle={styles.myWritingScrollContent}
                        showsVerticalScrollIndicator
                        bounces={false}
                        scrollEventThrottle={16}
                        keyboardShouldPersistTaps="handled"
                        directionalLockEnabled
                        disableScrollViewPanResponder
                      >
                        <AnimatedPassageText
                          key={`passage-${passageTransitionToken}-block`}
                          line={displayedText}
                          containerStyle={styles.paragraphContainer}
                          style={[styles.paragraph, paragraphFontStyle, { fontSize: bodyFontSize }]}
                          isReady={isTextReady}
                          onComplete={() => setShowSource(true)}
                          variant={fontVariant}
                          animationMode="block"
                        />

                        {sourceText && showSource ? (
                          <View style={styles.myWritingSourceWrap}>
                            <PassageSourceText
                              text={sourceText}
                              baseFontSize={bodyFontSize}
                              variant={fontVariant}
                              style={paragraphFontStyle}
                            />
                          </View>
                        ) : null}
                      </ScrollView>
                    ) : (
                      <>
                        <AnimatedPassageText
                          key={`passage-${passageTransitionToken}-word`}
                          line={displayedText}
                          containerStyle={styles.paragraphContainer}
                          style={[styles.paragraph, paragraphFontStyle, { fontSize: bodyFontSize }]}
                          isReady={isTextReady}
                          onComplete={() => setShowSource(true)}
                          variant={fontVariant}
                          animationMode="word"
                        />

                        {sourceReserveHeight > 0 ? (
                          <View
                            style={[
                              styles.sourceReserve,
                              { marginTop: 18, minHeight: sourceReserveHeight },
                            ]}
                          >
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
                      </>
                    )}
                  </View>
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
            onOpenUserMyWritingManager={handleOpenUserMyWritingManager}
            canUseMyWriting={storedMyWritings.length > 0}
            isFavoritesActive={draftIsFavoritePassageMode}
            canUseFavorites={favoritePassages.length > 0}
            onSetFavoritesActive={setDraftFavoritePassageMode}
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

          <UserMyWritingManager
            visible={isUserMyWritingManagerVisible}
            writings={draftMyWritings}
            selectedIds={draftSelectedMyWritingIds}
            maxItems={MAX_MY_WRITINGS}
            onToggleSelect={handleToggleDraftMyWritingSelection}
            onAdd={handleAddMyWriting}
            onEdit={handleEditMyWriting}
            onDeleteSelected={handleDeleteSelectedMyWritings}
            onApply={handleApplyMyWritings}
            onClose={closeUserMyWritingManager}
          />

          <UserMyWritingEditor
            visible={isMyWritingEditorVisible}
            mode={myWritingEditorMode}
            initialBody={myWritingEditorInitialBody}
            onCancel={handleMyWritingEditorCancel}
            onApply={handleMyWritingEditorApply}
            onDelete={myWritingEditorMode === 'edit' ? handleMyWritingEditorDelete : undefined}
          />

          {!isMenuVisible && !isUserBackgroundManagerVisible && !isUserMyWritingManagerVisible ? (
            <>
              {displayedPassage ? (
                <Pressable
                  hitSlop={8}
                  pressRetentionOffset={10}
                  style={styles.heartBottomButton}
                  onPress={toggleFavorite}
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 저장'}
                >
                  <View style={{ transform: [{ scale: 1 }] }}>
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                      <Text style={styles.heartIcon}>{isFavorite ? '♥' : '♡'}</Text>
                    </Animated.View>
                  </View>
                </Pressable>
              ) : null}

              <BottomDotButton
                style={styles.bottomButton}
                onPress={openMenu}
                accessibilityLabel="Open menu"
              />
            </>
          ) : null}
        </View>
      </AdaptiveBackground>
    </Animated.View>
  );
};
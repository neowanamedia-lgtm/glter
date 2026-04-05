import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import type {
  ContentCategory,
  EmotionKey,
  FontOption,
  LanguageOption,
  MenuSelectionState,
} from '../types/menu';

type MenuSlideSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (state: MenuSelectionState) => void;
  state: MenuSelectionState;
  onChange: React.Dispatch<React.SetStateAction<MenuSelectionState>>;
  hasPassages?: boolean;
  onOpenUserBackgroundManager?: () => Promise<boolean> | boolean;
  onSelectAutoBackground?: () => void;
};

const EMOTION_OPTIONS: Array<{ key: EmotionKey; label: string }> = [
  { key: 'unknown', label: '모름' },
  { key: 'joy', label: '기쁨' },
  { key: 'hope', label: '희망' },
  { key: 'anxiety', label: '불안' },
  { key: 'depression', label: '우울' },
  { key: 'sadness', label: '슬픔' },
];

const PHILOSOPHY_OPTIONS_ROW1: Array<{ key: ContentCategory; label: string }> = [
  { key: 'eastern_philosophy', label: '동양 철학' },
  { key: 'western_philosophy', label: '서양 철학' },
  { key: 'human' as ContentCategory, label: '인간' },
  { key: 'universe' as ContentCategory, label: '우주' },
  { key: 'destiny' as ContentCategory, label: '운명' },
];

const PHILOSOPHY_OPTIONS_ROW2: Array<{ key: ContentCategory; label: string }> = [
  { key: 'love' as ContentCategory, label: '사랑' },
  { key: 'friendship' as ContentCategory, label: '우정' },
  { key: 'death' as ContentCategory, label: '죽음' },
  { key: 'money' as ContentCategory, label: '돈' },
  { key: 'work_life' as ContentCategory, label: '직장생활' },
  { key: 'children' as ContentCategory, label: '자녀' },
];

const LITERATURE_OPTIONS: Array<{ key: ContentCategory; label: string }> = [
  { key: 'eastern_poetry', label: '동양시' },
  { key: 'western_poetry', label: '서양시' },
  { key: 'eastern_novel', label: '동양 소설' },
  { key: 'western_novel', label: '서양 소설' },
];

const RELIGION_OPTIONS: Array<{ key: ContentCategory; label: string }> = [
  { key: 'christianity', label: '기독교' },
  { key: 'buddhism', label: '불교' },
  { key: 'islam', label: '이슬람교' },
];

const LANGUAGE_OPTIONS: Array<{ key: LanguageOption; label: string }> = [
  { key: 'ko', label: '한국어' },
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
  { key: 'zh', label: '中文' },
  { key: 'es', label: 'Español' },
  { key: 'ar', label: 'العربية' },
];

const FONT_OPTIONS: Array<{ key: FontOption; label: string }> = [
  { key: 'basic', label: '기본 서체' },
  { key: 'soft', label: '부드럽게' },
  { key: 'script', label: '필기체' },
];

const ENABLED_LANGUAGES: Array<MenuSelectionState['language']> = ['ko'];
const ENABLED_LANGUAGE_SET = new Set<MenuSelectionState['language']>(ENABLED_LANGUAGES);

type ChipMode = 'regular' | 'compact' | 'tight';

export function MenuSlideSheet({
  visible,
  onClose,
  onApply,
  state,
  onChange,
  onOpenUserBackgroundManager,
  onSelectAutoBackground,
}: MenuSlideSheetProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const emotionMode: ChipMode = width < 390 ? 'compact' : 'regular';
  const philosophyMode: ChipMode = width < 430 ? 'compact' : 'regular';
  const literatureMode: ChipMode = width < 460 ? 'compact' : 'regular';
  const religionMode: ChipMode = width < 390 ? 'compact' : 'regular';
  const languageMode: ChipMode = 'tight';
  const fontMode: ChipMode = width < 460 ? 'compact' : 'regular';
  const backgroundMode: ChipMode = width < 460 ? 'compact' : 'regular';

  const handleEmotion = (emotion: EmotionKey) => {
    onChange((prev) => ({
      ...prev,
      emotion,
    }));
  };

  const handleCategoryToggle = (category: ContentCategory) => {
    onChange((prev) => {
      const exists = prev.selectedCategories.includes(category);

      if (exists) {
        const nextSelected = prev.selectedCategories.filter((item) => item !== category);
        return {
          ...prev,
          selectedCategories: nextSelected.length ? nextSelected : prev.selectedCategories,
        };
      }

      return {
        ...prev,
        selectedCategories: [...prev.selectedCategories, category],
      };
    });
  };

  const handleLanguage = (language: LanguageOption) => {
    if (!ENABLED_LANGUAGE_SET.has(language)) {
      return;
    }

    onChange((prev) => ({
      ...prev,
      language,
    }));
  };

  const handleFont = (font: FontOption) => {
    onChange((prev) => ({
      ...prev,
      font,
    }));
  };

  const handleAutoBackgroundPress = () => {
    onSelectAutoBackground?.();
    onChange((prev) => ({
      ...prev,
      background: 'auto',
    }));
  };

  const handleUploadBackgroundPress = async () => {
    if (isLandscape) {
      return;
    }

    const opened = await onOpenUserBackgroundManager?.();

    if (!opened) {
      return;
    }

    onChange((prev) => ({
      ...prev,
      background: 'upload',
    }));
  };

  const handleApplyPress = () => {
    onApply(state);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View
          style={[
            styles.contentOuter,
            isLandscape ? styles.contentOuterLandscape : styles.contentOuterPortrait,
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.contentWrap,
              isLandscape ? styles.contentWrapLandscape : styles.contentWrapPortrait,
            ]}
            pointerEvents="box-none"
          >
            <Text style={styles.brand}>glter</Text>
            <Text style={styles.copy}>지금 나의 문장, 생각이 머무는 글의 공간</Text>

            <View style={styles.sectionGap} />

            <RowBlock>
              {renderSingleSelectChips(
                EMOTION_OPTIONS,
                state.emotion,
                handleEmotion,
                emotionMode,
              )}
            </RowBlock>

            <RowBlock>
              {renderMultiSelectChips(
                PHILOSOPHY_OPTIONS_ROW1,
                state.selectedCategories,
                handleCategoryToggle,
                philosophyMode,
              )}
            </RowBlock>

            <RowBlock>
              {renderMultiSelectChips(
                PHILOSOPHY_OPTIONS_ROW2,
                state.selectedCategories,
                handleCategoryToggle,
                philosophyMode,
              )}
            </RowBlock>

            <RowBlock>
              {renderMultiSelectChips(
                LITERATURE_OPTIONS,
                state.selectedCategories,
                handleCategoryToggle,
                literatureMode,
              )}
            </RowBlock>

            <RowBlock>
              {renderMultiSelectChips(
                RELIGION_OPTIONS,
                state.selectedCategories,
                handleCategoryToggle,
                religionMode,
              )}
            </RowBlock>

            <RowBlock>
              {renderLanguageChips(
                LANGUAGE_OPTIONS,
                state.language,
                handleLanguage,
                languageMode,
              )}
            </RowBlock>

            <RowBlock>
              <View style={styles.inlineSection}>
                {renderSingleSelectChipList(
                  FONT_OPTIONS,
                  state.font,
                  handleFont,
                  fontMode,
                )}

                <View style={styles.inlineGapWide} />

                <View style={styles.backgroundChipList}>
                  <Pressable
                    hitSlop={8}
                    pressRetentionOffset={12}
                    style={[
                      styles.chip,
                      styles.inlineChip,
                      backgroundMode === 'compact' && styles.chipCompact,
                      backgroundMode === 'tight' && styles.chipTight,
                      state.background === 'auto' && styles.chipSelected,
                    ]}
                    onPress={handleAutoBackgroundPress}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        backgroundMode === 'compact' && styles.chipTextCompact,
                        backgroundMode === 'tight' && styles.chipTextTight,
                        state.background === 'auto' && styles.chipTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      자동배경
                    </Text>
                  </Pressable>

                  <Pressable
                    hitSlop={8}
                    pressRetentionOffset={12}
                    style={[
                      styles.chip,
                      styles.inlineChip,
                      backgroundMode === 'compact' && styles.chipCompact,
                      backgroundMode === 'tight' && styles.chipTight,
                      state.background === 'upload' && styles.chipSelected,
                      isLandscape && styles.chipDisabled,
                    ]}
                    disabled={isLandscape}
                    onPress={() => {
                      void handleUploadBackgroundPress();
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        backgroundMode === 'compact' && styles.chipTextCompact,
                        backgroundMode === 'tight' && styles.chipTextTight,
                        state.background === 'upload' && styles.chipTextSelected,
                        isLandscape && styles.chipTextDisabled,
                      ]}
                      numberOfLines={1}
                    >
                      불러오기
                    </Text>
                  </Pressable>
                </View>
              </View>
            </RowBlock>

            {isLandscape ? (
              <View style={styles.noticeWrap}>
                <Text style={styles.noticeText}>
                  사용자 배경 관리는 세로 화면에서만 사용할 수 있습니다.
                </Text>
              </View>
            ) : null}

            <View style={styles.applyGap} />

            <View style={styles.applyWrap}>
              <Pressable
                hitSlop={8}
                pressRetentionOffset={12}
                style={styles.applyButton}
                onPress={handleApplyPress}
              >
                <Text style={styles.applyButtonText}>문장 보기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RowBlock({ children }: { children: React.ReactNode }) {
  return <View style={styles.rowBlock}>{children}</View>;
}

function renderSingleSelectChips<T extends string>(
  options: Array<{ key: T; label: string }>,
  selected: T,
  onPress: (value: T) => void,
  mode: ChipMode,
) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = selected === option.key;

        return (
          <Pressable
            key={option.key}
            hitSlop={6}
            pressRetentionOffset={10}
            style={[
              styles.chip,
              mode === 'compact' && styles.chipCompact,
              mode === 'tight' && styles.chipTight,
              isSelected && styles.chipSelected,
            ]}
            onPress={() => onPress(option.key)}
          >
            <Text
              style={[
                styles.chipText,
                mode === 'compact' && styles.chipTextCompact,
                mode === 'tight' && styles.chipTextTight,
                isSelected && styles.chipTextSelected,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function renderSingleSelectChipList<T extends string>(
  options: Array<{ key: T; label: string }>,
  selected: T,
  onPress: (value: T) => void,
  mode: ChipMode,
) {
  return (
    <View style={styles.inlineChipList}>
      {options.map((option) => {
        const isSelected = selected === option.key;

        return (
          <Pressable
            key={option.key}
            hitSlop={6}
            pressRetentionOffset={10}
            style={[
              styles.chip,
              styles.inlineChip,
              mode === 'compact' && styles.chipCompact,
              mode === 'tight' && styles.chipTight,
              isSelected && styles.chipSelected,
            ]}
            onPress={() => onPress(option.key)}
          >
            <Text
              style={[
                styles.chipText,
                mode === 'compact' && styles.chipTextCompact,
                mode === 'tight' && styles.chipTextTight,
                isSelected && styles.chipTextSelected,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function renderMultiSelectChips(
  options: Array<{ key: ContentCategory; label: string }>,
  selected: ContentCategory[],
  onToggle: (value: ContentCategory) => void,
  mode: ChipMode,
) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = selected.includes(option.key);

        return (
          <Pressable
            key={option.key}
            hitSlop={6}
            pressRetentionOffset={10}
            style={[
              styles.chip,
              mode === 'compact' && styles.chipCompact,
              mode === 'tight' && styles.chipTight,
              isSelected && styles.chipSelected,
            ]}
            onPress={() => onToggle(option.key)}
          >
            <Text
              style={[
                styles.chipText,
                mode === 'compact' && styles.chipTextCompact,
                mode === 'tight' && styles.chipTextTight,
                isSelected && styles.chipTextSelected,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function renderLanguageChips(
  options: Array<{ key: LanguageOption; label: string }>,
  selected: LanguageOption,
  onSelect: (value: LanguageOption) => void,
  mode: ChipMode,
) {
  return (
    <View style={[styles.row, styles.languageRow]}>
      {options.map((option) => {
        const isSelected = selected === option.key;
        const isDisabled = !ENABLED_LANGUAGE_SET.has(option.key as MenuSelectionState['language']);

        return (
          <Pressable
            key={option.key}
            hitSlop={6}
            pressRetentionOffset={10}
            style={[
              styles.chip,
              mode === 'compact' && styles.chipCompact,
              mode === 'tight' && styles.chipTight,
              isSelected && styles.chipSelected,
              isDisabled && styles.chipDisabled,
            ]}
            disabled={isDisabled}
            onPress={() => onSelect(option.key)}
          >
            <Text
              style={[
                styles.chipText,
                mode === 'compact' && styles.chipTextCompact,
                mode === 'tight' && styles.chipTextTight,
                isSelected && styles.chipTextSelected,
                isDisabled && styles.chipTextDisabled,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentOuter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentOuterPortrait: {
    paddingTop: 44,
    paddingBottom: 28,
  },
  contentOuterLandscape: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 28,
  },
  contentWrap: {
    width: '100%',
    alignSelf: 'center',
  },
  contentWrapPortrait: {
    maxWidth: 1120,
    transform: [{ translateY: -24 }],
  },
  contentWrapLandscape: {
    maxWidth: 1420,
    transform: [{ translateX: 170 }, { translateY: -2 }],
  },
  brand: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: 0.2,
    marginBottom: 0,
  },
  copy: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 19,
    marginTop: 0,
  },
  sectionGap: {
    height: 8,
  },
  rowBlock: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  languageRow: {
    gap: 3,
  },
  inlineSection: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  inlineChipList: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 4,
  },
  backgroundChipList: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 4,
  },
  inlineChip: {
    minWidth: 0,
  },
  inlineGapWide: {
    width: 4,
  },
  chip: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipCompact: {
    minWidth: 54,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipTight: {
    minWidth: 50,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chipSelected: {
    backgroundColor: 'rgba(82, 166, 255, 0.72)',
    borderColor: 'rgba(121, 198, 255, 1)',
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    color: '#f5f8fb',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.15,
    lineHeight: 17,
  },
  chipTextCompact: {
    fontSize: 13,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  chipTextTight: {
    fontSize: 13,
    letterSpacing: -0.25,
    lineHeight: 15,
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextDisabled: {
    color: 'rgba(255,255,255,0.84)',
  },
  noticeWrap: {
    marginTop: 8,
  },
  noticeText: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
  },
  applyGap: {
    height: 42,
  },
  applyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
    lineHeight: 18,
    textAlign: 'center',
  },
});
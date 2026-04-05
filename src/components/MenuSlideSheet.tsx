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
  BackgroundOption,
  ContentCategory,
  EmotionKey,
  FontOption,
  LanguageOption,
  MenuSelectionState,
  SizeOption,
} from '../types/menu';

type MenuSlideSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (state: MenuSelectionState) => void;
  state: MenuSelectionState;
  onChange: React.Dispatch<React.SetStateAction<MenuSelectionState>>;
  hasPassages?: boolean;
};

const EMOTION_OPTIONS: Array<{ key: EmotionKey; label: string }> = [
  { key: 'unknown', label: '모름' },
  { key: 'joy', label: '기쁨' },
  { key: 'hope', label: '희망' },
  { key: 'anxiety', label: '불안' },
  { key: 'depression', label: '우울' },
  { key: 'sadness', label: '슬픔' },
];

const PHILOSOPHY_OPTIONS: Array<{ key: ContentCategory; label: string }> = [
  { key: 'eastern_philosophy', label: '동양 철학' },
  { key: 'western_philosophy', label: '서양 철학' },
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

const SIZE_OPTIONS: Array<{ key: SizeOption; label: string }> = [
  { key: 'large', label: '크게' },
  { key: 'small', label: '작게' },
];

const BACKGROUND_OPTIONS: Array<{ key: BackgroundOption; label: string }> = [
  { key: 'auto', label: '자동 배경' },
  { key: 'upload', label: '불러오기' },
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
}: MenuSlideSheetProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const emotionMode: ChipMode = width < 390 ? 'compact' : 'regular';
  const philosophyMode: ChipMode = width < 390 ? 'compact' : 'regular';
  const literatureMode: ChipMode = width < 460 ? 'compact' : 'regular';
  const religionMode: ChipMode = width < 390 ? 'compact' : 'regular';
  const languageMode: ChipMode = 'tight';
  const fontSizeMode: ChipMode = width < 460 ? 'compact' : 'regular';
  const backgroundMode: ChipMode = 'regular';

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

  const handleSize = (size: SizeOption) => {
    onChange((prev) => ({
      ...prev,
      size,
    }));
  };

  const handleBackground = (background: BackgroundOption) => {
    onChange((prev) => ({
      ...prev,
      background,
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
          <Pressable
            style={[
              styles.contentWrap,
              isLandscape ? styles.contentWrapLandscape : styles.contentWrapPortrait,
            ]}
            onPress={() => {}}
          >
            <Text style={styles.brand}>Seloa</Text>
            <Text style={styles.copy}>지금 나에게 맞는 한 문단의 문장</Text>

            <View style={styles.sectionGap} />

            <RowBlock>
              {renderSingleSelectChips(EMOTION_OPTIONS, state.emotion, handleEmotion, emotionMode)}
            </RowBlock>

            <RowBlock>
              {renderMultiSelectChips(PHILOSOPHY_OPTIONS, state.selectedCategories, handleCategoryToggle, philosophyMode)}
            </RowBlock>

            <RowBlock>
              {renderMultiSelectChips(LITERATURE_OPTIONS, state.selectedCategories, handleCategoryToggle, literatureMode)}
            </RowBlock>

            <RowBlock>
              {renderMultiSelectChips(RELIGION_OPTIONS, state.selectedCategories, handleCategoryToggle, religionMode)}
            </RowBlock>

            <RowBlock>
              {renderLanguageChips(LANGUAGE_OPTIONS, state.language, handleLanguage, languageMode)}
            </RowBlock>

            <RowBlock>
              <View style={styles.inlineRow}>
                {renderSingleSelectChips(FONT_OPTIONS, state.font, handleFont, fontSizeMode)}
                <View style={styles.inlineGap} />
                {renderSingleSelectChips(SIZE_OPTIONS, state.size, handleSize, fontSizeMode)}
              </View>
            </RowBlock>

            <RowBlock>
              {renderSingleSelectChips(BACKGROUND_OPTIONS, state.background, handleBackground, backgroundMode)}
            </RowBlock>

            <View style={styles.applyGap} />

            <View style={styles.applyWrap}>
              <Pressable style={styles.applyButton} onPress={handleApplyPress}>
                <Text style={styles.applyButtonText}>문장 보기</Text>
              </Pressable>
            </View>
          </Pressable>
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
    paddingHorizontal: 22,
  },
  contentOuterPortrait: {
    paddingTop: 48,
    paddingBottom: 34,
  },
  contentOuterLandscape: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 30,
  },
  contentWrap: {
    width: '100%',
    alignSelf: 'center',
  },
  contentWrapPortrait: {
    maxWidth: 980,
    transform: [{ translateY: -28 }],
  },
  contentWrapLandscape: {
    maxWidth: 1320,
    transform: [{ translateX: 200 }, { translateY: -4 }],
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
    lineHeight: 20,
    marginTop: 0,
  },
  sectionGap: {
    height: 14,
  },
  rowBlock: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  languageRow: {
    gap: 4,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inlineGap: {
    width: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  chipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipTight: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipSelected: {
    backgroundColor: 'rgba(82, 166, 255, 0.72)',
    borderColor: 'rgba(121, 198, 255, 1)',
  },
  chipDisabled: {
    opacity: 0.62,
  },
  chipText: {
    color: '#f5f8fb',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  chipTextCompact: {
    fontSize: 13,
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  chipTextTight: {
    fontSize: 13,
    letterSpacing: -0.3,
    lineHeight: 16,
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextDisabled: {
    color: 'rgba(255,255,255,0.90)',
  },
  applyGap: {
    height: 14,
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
  },
});
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { FontVariant, FONT_FAMILY_BY_VARIANT } from './PassageSourceText';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  lineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
  },
  word: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'left',
  },
  blockText: {
    width: '100%',
  },
});

const WORD_FADE_DURATION = 660;
const WORD_STAGGER = 220;
const WORD_TRANSLATE_Y = 16;

const BLOCK_FADE_DURATION = 380;
const BLOCK_TRANSLATE_Y = 8;

const HANDWRITING_FONT_WEIGHT: TextStyle['fontWeight'] = '100';
const HANDWRITING_SIZE_BONUS = 0;
const HANDWRITING_LINE_HEIGHT_MULTIPLIER = 8.75;
const HANDWRITING_LETTER_SPACING = -0.8;

const SOFT_LINE_HEIGHT_MULTIPLIER = 1.5;
const DEFAULT_LINE_HEIGHT_MULTIPLIER = 1.5;

const SOFT_LETTER_SPACING = -0.4;
const DEFAULT_LETTER_SPACING = -0.2;

export type AnimatedPassageTextProps = {
  line: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  isReady?: boolean;
  onComplete?: () => void;
  variant: FontVariant;
  animationMode?: 'word' | 'block';
};

type WordToken = {
  key: string;
  text: string;
  lineIndex: number;
  wordIndex: number;
  globalIndex: number;
};

const getDefaultLineHeight = (variant: FontVariant, fontSize: number): number => {
  switch (variant) {
    case 'soft':
      return fontSize * SOFT_LINE_HEIGHT_MULTIPLIER;
    case 'handwriting':
      return fontSize * HANDWRITING_LINE_HEIGHT_MULTIPLIER;
    default:
      return fontSize * DEFAULT_LINE_HEIGHT_MULTIPLIER;
  }
};

const getDefaultLetterSpacing = (variant: FontVariant): number => {
  switch (variant) {
    case 'soft':
      return SOFT_LETTER_SPACING;
    case 'handwriting':
      return HANDWRITING_LETTER_SPACING;
    default:
      return DEFAULT_LETTER_SPACING;
  }
};

const createVariantTypography = (
  variant: FontVariant,
  baseSize: number,
  overrides: { lineHeight?: number; letterSpacing?: number },
): TextStyle => {
const fontSize =
  variant === 'handwriting'
    ? baseSize + HANDWRITING_SIZE_BONUS
    : variant === 'soft'
    ? baseSize - 1
    : baseSize;

  return {
    fontFamily: FONT_FAMILY_BY_VARIANT[variant],
    fontSize,
    lineHeight: overrides.lineHeight ?? getDefaultLineHeight(variant, baseSize),
    letterSpacing: overrides.letterSpacing ?? getDefaultLetterSpacing(variant),
    ...(variant === 'handwriting'
      ? {
          fontWeight: HANDWRITING_FONT_WEIGHT,
        }
      : null),
  };
};

export const AnimatedPassageText: React.FC<AnimatedPassageTextProps> = ({
  line,
  style,
  containerStyle,
  isReady = true,
  onComplete,
  variant,
  animationMode = 'word',
}) => {
  const safeLine = typeof line === 'string' ? line : '';
  const normalizedLine = safeLine.trim();

  const lineBlocks = useMemo(
    () =>
      normalizedLine.length > 0
        ? normalizedLine
            .split('\n')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [],
    [normalizedLine],
  );

  const wordTokens = useMemo<WordToken[]>(() => {
    let globalIndex = 0;

    return lineBlocks.flatMap((lineText, lineIndex) =>
      lineText.split(/\s+/).filter(Boolean).map((word, wordIndex) => {
        const token: WordToken = {
          key: `line-${lineIndex}-word-${wordIndex}-${globalIndex}`,
          text: word,
          lineIndex,
          wordIndex,
          globalIndex,
        };
        globalIndex += 1;
        return token;
      }),
    );
  }, [lineBlocks]);

  const animatedValuesRef = useRef<Animated.Value[]>([]);
  const blockOpacity = useRef(new Animated.Value(0)).current;
  const blockTranslateY = useRef(new Animated.Value(BLOCK_TRANSLATE_Y)).current;

  const hasCompletedRef = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const completeOnce = () => {
    if (hasCompletedRef.current) {
      return;
    }
    hasCompletedRef.current = true;
    onComplete?.();
  };

  useEffect(() => {
    hasCompletedRef.current = false;
    animationRef.current?.stop();
    animationRef.current = null;

    if (animationMode === 'word') {
      animatedValuesRef.current = Array.from(
        { length: wordTokens.length },
        () => new Animated.Value(0),
      );
    } else {
      animatedValuesRef.current = [];
      blockOpacity.setValue(0);
      blockTranslateY.setValue(BLOCK_TRANSLATE_Y);
    }
  }, [animationMode, blockOpacity, blockTranslateY, normalizedLine, variant, wordTokens.length]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!normalizedLine.length) {
      return;
    }

    if (hasCompletedRef.current) {
      return;
    }

    if (animationMode === 'block') {
      const sequence = Animated.parallel([
        Animated.timing(blockOpacity, {
          toValue: 1,
          duration: BLOCK_FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(blockTranslateY, {
          toValue: 0,
          duration: BLOCK_FADE_DURATION,
          useNativeDriver: true,
        }),
      ]);

      animationRef.current = sequence;

      sequence.start(({ finished }) => {
        animationRef.current = null;

        if (!finished) {
          return;
        }

        completeOnce();
      });

      return () => {
        animationRef.current?.stop();
        animationRef.current = null;
      };
    }

    if (wordTokens.length === 0 || animatedValuesRef.current.length !== wordTokens.length) {
      completeOnce();
      return;
    }

    const animations = animatedValuesRef.current.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: WORD_FADE_DURATION,
        useNativeDriver: true,
      }),
    );

    const sequence = Animated.stagger(WORD_STAGGER, animations);
    animationRef.current = sequence;

    sequence.start(({ finished }) => {
      animationRef.current = null;

      if (!finished) {
        return;
      }

      completeOnce();
    });

    return () => {
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [
    animationMode,
    blockOpacity,
    blockTranslateY,
    isReady,
    normalizedLine,
    wordTokens.length,
  ]);

  if (!normalizedLine.length) {
    return null;
  }

  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const baseSize =
    typeof flattenedStyle.fontSize === 'number'
      ? flattenedStyle.fontSize
      : styles.word.fontSize;

  const variantTypography = createVariantTypography(variant, baseSize, {
    lineHeight:
      typeof flattenedStyle.lineHeight === 'number'
        ? flattenedStyle.lineHeight
        : undefined,
    letterSpacing:
      typeof flattenedStyle.letterSpacing === 'number'
        ? flattenedStyle.letterSpacing
        : undefined,
  });

  if (animationMode === 'block') {
    return (
      <Animated.View
        style={[
          styles.container,
          containerStyle,
          {
            opacity: blockOpacity,
            transform: [{ translateY: blockTranslateY }],
          },
        ]}
      >
        <Animated.Text style={[styles.word, styles.blockText, style, variantTypography]}>
          {lineBlocks.join('\n')}
        </Animated.Text>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {lineBlocks.map((lineText, lineIndex) => {
        const lineWords = lineText.split(/\s+/).filter(Boolean);

        return (
          <View key={`line-${lineIndex}`} style={styles.lineRow}>
            {lineWords.map((word, wordIndex) => {
              const token = wordTokens.find(
                (item) => item.lineIndex === lineIndex && item.wordIndex === wordIndex,
              );
              const animatedValue =
                typeof token?.globalIndex === 'number'
                  ? animatedValuesRef.current[token.globalIndex]
                  : undefined;

              if (!animatedValue) {
                return (
                  <Animated.Text
                    key={`word-${lineIndex}-${wordIndex}`}
                    style={[styles.word, style, variantTypography]}
                  >
                    {word}
                    {wordIndex < lineWords.length - 1 ? ' ' : ''}
                  </Animated.Text>
                );
              }

              return (
                <Animated.Text
                  key={`word-${lineIndex}-${wordIndex}`}
                  style={[
                    styles.word,
                    style,
                    variantTypography,
                    {
                      opacity: animatedValue,
                      transform: [
                        {
                          translateY: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [WORD_TRANSLATE_Y, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {word}
                  {wordIndex < lineWords.length - 1 ? ' ' : ''}
                </Animated.Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};
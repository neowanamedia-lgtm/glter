import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';

import { FontVariant, FONT_FAMILY_BY_VARIANT } from './PassageSourceText';

const styles = StyleSheet.create({
  lineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  word: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'left',
  },
});

const WORD_FADE_DURATION = 660;
const WORD_STAGGER = 220;
const WORD_TRANSLATE_Y = 16;

/**
 * 🔥 필기체 미세조정 포인트
 * - 굵기: HANDWRITING_FONT_WEIGHT
 * - 크기: HANDWRITING_SIZE_BONUS
 * - 행간: HANDWRITING_LINE_HEIGHT_MULTIPLIER
 * - 자간: HANDWRITING_LETTER_SPACING
 *
 * 추천 시작값:
 * - 굵기: '10'
 * - 크기: 0
 * - 행간: 10.0
 * - 자간: 0.32
 */
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
  const fontSize = variant === 'handwriting' ? baseSize + HANDWRITING_SIZE_BONUS : baseSize;

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
}) => {
  const safeLine = typeof line === 'string' ? line : '';
  const normalizedLine = safeLine.trim();

  const words = useMemo(
    () => (normalizedLine.length > 0 ? normalizedLine.split(/\s+/) : []),
    [normalizedLine],
  );

  const animatedValues = useMemo(
    () => words.map(() => new Animated.Value(0)),
    [words],
  );

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
    animatedValues.forEach((value) => value.setValue(0));
  }, [normalizedLine, animatedValues, isReady, variant]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!normalizedLine.length) {
      return;
    }

    if (words.length === 0) {
      return;
    }

    if (hasCompletedRef.current) {
      return;
    }

    const animations = animatedValues.map((value) =>
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
  }, [animatedValues, isReady, normalizedLine, words.length]);

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

  return (
    <View style={[styles.lineContainer, containerStyle]}>
      {words.map((word, index) => (
        <Animated.Text
          key={`word-${index}-${word}`}
          style={[
            styles.word,
            style,
            variantTypography,
            {
              opacity: animatedValues[index],
              transform: [
                {
                  translateY: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [WORD_TRANSLATE_Y, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </Animated.Text>
      ))}
    </View>
  );
};
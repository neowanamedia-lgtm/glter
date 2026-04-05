import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

export type FontVariant = 'default' | 'soft' | 'handwriting';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  text: {
    color: 'rgba(255,255,255,0.78)',
    paddingLeft: 18,
    textAlign: 'left',
  },
});

export const FONT_FAMILY_BY_VARIANT: Record<FontVariant, string> = {
  default: 'NotoSansKR-Regular',
  soft: 'NanumMyeongjo-Regular',
  handwriting: 'NanumPenScript-Regular',
};

export const buildSourceTypography = (baseFontSize: number, variant: FontVariant): TextStyle => {
  const fontSize = Math.max(baseFontSize - 2 + (variant === 'handwriting' ? 1 : 0), 8);
  let lineHeight: number;
  let letterSpacing: number;

  switch (variant) {
    case 'soft':
      lineHeight = fontSize * 1.55;
      letterSpacing = 0.3;
      break;
    case 'handwriting':
      lineHeight = fontSize * 1.68;
      letterSpacing = 0.32;
      break;
    default:
      lineHeight = fontSize * 1.5;
      letterSpacing = 0.1;
      break;
  }

  return {
    fontFamily: FONT_FAMILY_BY_VARIANT[variant],
    fontSize,
    lineHeight,
    letterSpacing,
  };
};

type PassageSourceTextProps = {
  text: string;
  baseFontSize: number;
  variant: FontVariant;
  style?: StyleProp<TextStyle>;
};

export const PassageSourceText: React.FC<PassageSourceTextProps> = ({ text, baseFontSize, variant, style }) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const typography = buildSourceTypography(baseFontSize, variant);

  return (
    <View style={styles.container}>
      <Text style={[styles.text, style, typography]}>{trimmed}</Text>
    </View>
  );
};

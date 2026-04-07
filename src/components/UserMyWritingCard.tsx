import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MyWriting } from '../types/myWriting';

type UserMyWritingCardProps = {
  writing: MyWriting;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  disabled?: boolean;
};

const PREVIEW_LINES = 2;
const LONG_PRESS_DELAY_MS = 240;

export const UserMyWritingCard: React.FC<UserMyWritingCardProps> = ({
  writing,
  selected,
  onToggleSelect,
  onEdit,
  disabled = false,
}) => {
  const preview = buildPreview(writing.body);

  return (
    <View style={styles.slot}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          selected && styles.cardSelected,
          pressed && !disabled && styles.cardPressed,
          disabled && styles.cardDisabled,
        ]}
        onPress={onToggleSelect}
        onLongPress={onEdit}
        delayLongPress={LONG_PRESS_DELAY_MS}
        disabled={disabled}
      >
        <Text style={styles.preview} numberOfLines={PREVIEW_LINES} ellipsizeMode="tail">
          {preview}
        </Text>
      </Pressable>
    </View>
  );
};

const buildPreview = (body: string): string => {
  const normalized = body.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return '작성된 내용이 없습니다';
  }

  const lines = normalized.split('\n').map((line) => line.trim());
  const previewLines = lines.slice(0, PREVIEW_LINES);
  const preview = previewLines.join('\n');

  if (lines.length > PREVIEW_LINES) {
    return `${preview} …`;
  }

  return preview;
};

const styles = StyleSheet.create({
  slot: {
    position: 'relative',
  },
  card: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(19,22,30,0.78)',
    padding: 12,
    justifyContent: 'flex-start',
  },
  cardSelected: {
    borderColor: 'rgba(121,198,255,1)',
    borderWidth: 2,
    backgroundColor: 'rgba(46,70,105,0.58)',
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  preview: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
});
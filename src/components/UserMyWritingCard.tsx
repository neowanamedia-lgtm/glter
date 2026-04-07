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
        onPress={onEdit}
        disabled={disabled}
      >
        <Text style={styles.preview} numberOfLines={PREVIEW_LINES} ellipsizeMode="tail">
          {preview}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.selectBadge, selected && styles.selectBadgeActive]}
        onPress={onToggleSelect}
        hitSlop={8}
      >
        <Text style={[styles.selectBadgeText, selected && styles.selectBadgeTextActive]}>
          {selected ? '선택됨' : '선택'}
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
  selectBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(0,0,0,0.32)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectBadgeActive: {
    borderColor: 'rgba(121,198,255,1)',
    backgroundColor: 'rgba(82,166,255,0.85)',
  },
  selectBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  selectBadgeTextActive: {
    color: '#0d1c2f',
  },
});

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { UserMyWritingCard } from '../../components/UserMyWritingCard';
import type { MyWriting } from '../../types/myWriting';

const COLUMNS = 3;
const DEFAULT_MAX_ITEMS = 90;

type UserMyWritingManagerProps = {
  visible: boolean;
  writings: MyWriting[];
  selectedIds: string[];
  maxItems?: number;
  onToggleSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (writing: MyWriting) => void;
  onDeleteSelected: () => void;
  onApply: () => void;
  onClose: () => void;
};

export const UserMyWritingManager: React.FC<UserMyWritingManagerProps> = ({
  visible,
  writings,
  selectedIds,
  maxItems = DEFAULT_MAX_ITEMS,
  onToggleSelect,
  onAdd,
  onEdit,
  onDeleteSelected,
  onApply,
  onClose,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const safeMaxItems = Math.max(1, maxItems);
  const isEmpty = writings.length === 0;

  const slotItems = useMemo(() => {
    const trimmed = writings.slice(0, safeMaxItems);
    const emptyCount = Math.max(0, safeMaxItems - trimmed.length);

    return [
      ...trimmed.map((writing) => ({ type: 'writing' as const, writing })),
      ...Array.from({ length: emptyCount }, (_, index) => ({ type: 'empty' as const, key: `empty-${index}` })),
    ];
  }, [safeMaxItems, writings]);

  const canApply = selectedIds.length > 0;
  const canDelete = selectedIds.length > 0;
  const canAdd = writings.length < safeMaxItems;
  const isAllSelected = writings.length > 0 && writings.every((item) => selectedSet.has(item.id));

  const handleToggleAll = () => {
    writings.forEach((item) => {
      const already = selectedSet.has(item.id);
      if (isAllSelected && already) {
        onToggleSelect(item.id);
      } else if (!isAllSelected && !already) {
        onToggleSelect(item.id);
      }
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.dim} />

      <View
        style={[
          styles.sheet,
          isLandscape ? styles.sheetLandscape : styles.sheetPortrait,
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>사용자 내글 관리</Text>
          <Pressable hitSlop={8} onPress={onClose}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
        </View>

        <View style={styles.topButtonRow}>
          <Pressable
            style={[styles.actionButton, isEmpty && styles.actionButtonDisabled]}
            onPress={handleToggleAll}
            disabled={isEmpty}
          >
            <Text
              style={[
                styles.actionButtonText,
                isEmpty && styles.actionButtonTextDisabled,
              ]}
            >
              {isAllSelected ? '전체 해제' : '전체 선택'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, !canDelete && styles.actionButtonDisabled]}
            onPress={onDeleteSelected}
            disabled={!canDelete}
          >
            <Text
              style={[
                styles.actionButtonText,
                !canDelete && styles.actionButtonTextDisabled,
              ]}
            >
              삭제
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.gridWrap}>
            {slotItems.map((item) => {
              if (item.type === 'empty') {
                return (
                  <View key={item.key} style={styles.slot}>
                    <View style={[styles.slotInner, styles.emptySlot]} />
                  </View>
                );
              }

              const writing = item.writing;
              const isSelected = selectedSet.has(writing.id);

              return (
                <View key={writing.id} style={styles.slot}>
                  <UserMyWritingCard
                    writing={writing}
                    selected={isSelected}
                    onToggleSelect={() => onToggleSelect(writing.id)}
                    onEdit={() => onEdit(writing)}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.bottomButtonRow}>
          <Pressable
            style={[
              isEmpty ? styles.primaryButton : styles.secondaryButton,
              !canAdd && styles.actionButtonDisabled,
            ]}
            disabled={!canAdd}
            onPress={onAdd}
          >
            <Text style={isEmpty ? styles.primaryButtonText : styles.secondaryButtonText}>추가</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, !canApply && styles.primaryButtonDisabled]}
            disabled={!canApply}
            onPress={onApply}
          >
            <Text style={[styles.primaryButtonText, !canApply && styles.primaryButtonTextDisabled]}>적용</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
    zIndex: 1000,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: 760,
    borderRadius: 22,
    backgroundColor: 'rgba(20,24,30,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  sheetPortrait: {
    maxHeight: '92%',
  },
  sheetLandscape: {
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  closeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
  },
  topButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionButtonTextDisabled: {
    color: 'rgba(255,255,255,0.7)',
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(121,198,255,0.9)',
    backgroundColor: 'rgba(82,166,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButtonTextDisabled: {
    color: 'rgba(255,255,255,0.55)',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  gridScroll: {
    flexGrow: 0,
  },
  gridScrollContent: {
    paddingBottom: 2,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  slot: {
    width: `${100 / COLUMNS}%`,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  slotInner: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  emptySlot: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderStyle: 'dashed',
  },
});

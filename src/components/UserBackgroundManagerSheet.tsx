import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

type UserBackgroundManagerSheetProps = {
  visible: boolean;
  backgrounds: string[];
  selectedUris: string[];
  maxItems?: number;
  onToggleSelect: (uri: string) => void;
  onAdd: () => void | Promise<void>;
  onDeleteSelected: () => void;
  onApply: () => void;
  onClose: () => void;
};

const DEFAULT_MAX_ITEMS = 12;

export function UserBackgroundManagerSheet({
  visible,
  backgrounds,
  selectedUris,
  maxItems = DEFAULT_MAX_ITEMS,
  onToggleSelect,
  onAdd,
  onDeleteSelected,
  onApply,
  onClose,
}: UserBackgroundManagerSheetProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const columns = 3;
  const rows = 4;

  const safeMaxItems = Math.max(1, maxItems);
  const selectedSet = useMemo(() => new Set(selectedUris), [selectedUris]);

  const slotItems = useMemo(() => {
    const trimmed = backgrounds.slice(0, safeMaxItems);
    const emptyCount = Math.max(0, safeMaxItems - trimmed.length);

    return [
      ...trimmed.map((uri) => ({ type: 'image' as const, uri })),
      ...Array.from({ length: emptyCount }, (_, index) => ({
        type: 'empty' as const,
        key: `empty-${index}`,
      })),
    ];
  }, [backgrounds, safeMaxItems]);

  const canApply = selectedUris.length > 0;
  const canDelete = selectedUris.length > 0;
  const canAdd = backgrounds.length < safeMaxItems;

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
        <Text style={styles.title}>사용자 배경 관리</Text>

        <Text style={styles.guide}>원하는 배경 이미지를 추가해 주세요.</Text>
        <Text style={styles.guide}>사용자 배경은 세로 화면 기준으로 적용됩니다.</Text>
        <Text style={styles.guide}>가로 화면에서는 일부 영역이 잘릴 수 있습니다.</Text>
        <Text style={styles.guide}>권장 이미지 비율: 세로 9:16</Text>
        <Text style={styles.guideLast}>예: 1440 × 3200</Text>

        <View style={styles.topButtonRow}>
          <Pressable
            style={[
              styles.actionButton,
              !canAdd && styles.actionButtonDisabled,
            ]}
            disabled={!canAdd}
            onPress={() => {
              void onAdd();
            }}
          >
            <Text
              style={[
                styles.actionButtonText,
                !canAdd && styles.actionButtonTextDisabled,
              ]}
            >
              추가
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              !canDelete && styles.actionButtonDisabled,
            ]}
            disabled={!canDelete}
            onPress={onDeleteSelected}
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

        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.gridScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridWrap}>
            {slotItems.map((item, index) => {
              if (item.type === 'empty') {
                return (
                  <View
                    key={item.key}
                    style={[
                      styles.slot,
                      index >= columns * rows ? styles.slotHidden : null,
                    ]}
                  >
                    <View style={[styles.slotInner, styles.emptySlot]} />
                  </View>
                );
              }

              const isSelected = selectedSet.has(item.uri);

              return (
                <View
                  key={item.uri}
                  style={[
                    styles.slot,
                    index >= columns * rows ? styles.slotHidden : null,
                  ]}
                >
                  <Pressable
                    style={[
                      styles.slotInner,
                      isSelected && styles.slotInnerSelected,
                    ]}
                    onPress={() => onToggleSelect(item.uri)}
                  >
                    <Image source={{ uri: item.uri }} style={styles.slotImage} />
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>선택됨</Text>
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.bottomButtonRow}>
          <Pressable
            style={[
              styles.primaryButton,
              !canApply && styles.primaryButtonDisabled,
            ]}
            disabled={!canApply}
            onPress={onApply}
          >
            <Text
              style={[
                styles.primaryButtonText,
                !canApply && styles.primaryButtonTextDisabled,
              ]}
            >
              적용
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
    zIndex: 999,
    elevation: 999,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.36)',
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
    maxWidth: 760,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  guide: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  guideLast: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  topButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    paddingHorizontal: 14,
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
    color: 'rgba(255,255,255,0.84)',
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(121, 198, 255, 0.9)',
    backgroundColor: 'rgba(82, 166, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
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
    paddingHorizontal: 14,
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
    width: '33.3333%',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  slotHidden: {
    display: 'none',
  },
  slotInner: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  emptySlot: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  slotInnerSelected: {
    borderColor: 'rgba(121,198,255,1)',
    borderWidth: 2,
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(82,166,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
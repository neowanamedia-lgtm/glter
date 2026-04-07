import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

type UserMyWritingEditorProps = {
  visible: boolean;
  mode: 'create' | 'edit';
  initialBody: string;
  onCancel: () => void;
  onApply: (body: string) => void;
  onDelete?: () => void;
};

export const UserMyWritingEditor: React.FC<UserMyWritingEditorProps> = ({
  visible,
  mode,
  initialBody,
  onCancel,
  onApply,
  onDelete,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    if (visible) {
      setBody(initialBody);
    }
  }, [initialBody, visible]);

  const trimmed = body.trim();
  const canApply = trimmed.length > 0;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      presentationStyle="overFullScreen"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dim} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <View
            style={[
              styles.sheet,
              isLandscape ? styles.sheetLandscape : styles.sheetPortrait,
            ]}
          >
            <Text style={styles.title}>{mode === 'create' ? '새 글 작성' : '내 글 수정'}</Text>
            <Text style={styles.subtitle}>줄바꿈과 문장 간격은 입력한 그대로 표시됩니다.</Text>

            <View style={styles.editorWrap}>
              <TextInput
                style={styles.textInput}
                multiline
                textAlignVertical="top"
                value={body}
                onChangeText={setBody}
                autoFocus
                placeholder="여기에 글을 입력하세요"
                placeholderTextColor="rgba(255,255,255,0.35)"
              />
            </View>

            <View style={styles.buttonRow}>
              {mode === 'edit' ? (
                <Pressable style={[styles.destructiveButton, !onDelete && styles.disabledButton]} onPress={onDelete}>
                  <Text style={styles.destructiveText}>삭제</Text>
                </Pressable>
              ) : null}

              <View style={styles.buttonSpacer} />

              <Pressable style={styles.secondaryButton} onPress={onCancel}>
                <Text style={styles.secondaryButtonText}>취소</Text>
              </Pressable>

              <Pressable
                style={[styles.primaryButton, !canApply && styles.primaryButtonDisabled]}
                onPress={() => onApply(trimmed)}
                disabled={!canApply}
              >
                <Text style={[styles.primaryButtonText, !canApply && styles.primaryButtonTextDisabled]}>
                  적용
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 780,
    borderRadius: 24,
    backgroundColor: 'rgba(20,24,30,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sheetPortrait: {
    minHeight: 420,
  },
  sheetLandscape: {
    minHeight: 300,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  editorWrap: {
    flexGrow: 1,
    minHeight: 240,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 14,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 26,
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'NotoSansKR-Regular' }),
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  buttonSpacer: {
    flex: 1,
  },
  primaryButton: {
    minWidth: 96,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(82,166,255,0.85)',
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButtonTextDisabled: {
    color: 'rgba(255,255,255,0.6)',
  },
  secondaryButton: {
    minWidth: 80,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  destructiveButton: {
    minWidth: 70,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,99,99,0.7)',
    marginRight: 8,
  },
  destructiveText: {
    color: 'rgba(255,128,128,0.9)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
});

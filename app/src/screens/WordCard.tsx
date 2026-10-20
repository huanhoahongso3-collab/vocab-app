import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import { Chip, Dialog, IconButton, Portal, RadioButton, Text, useTheme } from 'react-native-paper';
import type { VocabWord } from '../models';
import { useSaved } from '../store';
import { BIG } from '../theme';

export function WordCard({
  word,
  saved,
  onToggleSave,
  onSelectDoc,
}: {
  word: VocabWord;
  saved: boolean;
  onToggleSave: () => void;
  onSelectDoc?: (docId: string) => void;
}) {
  const theme = useTheme();
  const { docs, assignWordToDoc } = useSaved();
  const [open, setOpen] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    setOpen((o) => !o);
  };

  const isC1 = word.level === 'C1';
  const levelBg = isC1 ? '#EDE7F6' : '#E0F2F1';
  const levelTextColor = isC1 ? '#5E35B1' : '#00796B';

  const doc = docs.find((d) => d.id === word.docId);

  const handleSpeak = () => {
    Speech.speak(word.word, { language: 'en-US', rate: 0.95 });
  };

  return (
    <>
      <Pressable
        onPress={toggle}
        style={[
          styles.card,
          {
            backgroundColor: open ? theme.colors.surfaceVariant : theme.colors.elevation.level2,
            borderColor: open ? theme.colors.primary : 'transparent',
            borderWidth: open ? 1.5 : 0,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.pillBadge, { backgroundColor: levelBg }]}>
              <Text style={[styles.pillText, { color: levelTextColor }]}>{word.level}</Text>
            </View>
            {!!word.pos && (
              <View style={[styles.posBadge, { backgroundColor: theme.colors.surfaceDisabled }]}>
                <Text style={styles.posText}>{word.pos}</Text>
              </View>
            )}
            {saved && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setShowDocPicker(true);
                }}
                style={styles.docBadge}
              >
                <IconButton icon="file-document-outline" size={14} style={styles.docIcon} iconColor={theme.colors.primary} />
                <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '600' }} numberOfLines={1}>
                  {doc?.title || 'Untitled Document'}
                </Text>
              </Pressable>
            )}
            {word.mastered && (
              <View style={styles.masteredBadge}>
                <Text style={styles.masteredText}>Đã thuộc ⭐</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <IconButton
              icon="volume-high"
              size={20}
              mode="contained-tonal"
              style={styles.iconBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleSpeak();
              }}
              accessibilityLabel="Phát âm"
            />
            <IconButton
              icon={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              mode={saved ? 'contained' : 'outlined'}
              style={styles.iconBtn}
              onPress={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              accessibilityLabel={saved ? 'Bỏ lưu' : 'Lưu từ'}
            />
          </View>
        </View>

        <View style={styles.mainInfo}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={styles.wordTitle}>{word.word}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {word.meaningVi}
            </Text>
          </View>
          <IconButton
            icon={open ? 'chevron-up' : 'chevron-down'}
            size={20}
            style={styles.chevron}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>

        {open && (
          <View style={styles.expandedContent}>
            {!!word.ipa && (
              <View style={styles.ipaRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary, fontStyle: 'italic', fontSize: 15 }}>
                  {word.ipa}
                </Text>
              </View>
            )}

            {!!word.definitionEn && (
              <View style={styles.defBox}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}>
                  {word.definitionEn}
                </Text>
              </View>
            )}

            {!!word.exampleEn && (
              <View style={[styles.exampleBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                <Text variant="bodyMedium" style={styles.exampleEnText}>
                  “{word.exampleEn}”
                </Text>
                {!!word.exampleVi && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    {word.exampleVi}
                  </Text>
                )}
              </View>
            )}

            {word.collocations && word.collocations.length > 0 && (
              <View style={styles.collocationsContainer}>
                <Text variant="labelSmall" style={{ color: theme.colors.outline, marginBottom: 4 }}>
                  Cụm từ phổ biến (Collocations):
                </Text>
                <View style={styles.chipsRow}>
                  {word.collocations.map((c) => (
                    <Chip key={c} compact style={styles.colChip} textStyle={{ fontSize: 12 }}>
                      {c}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </Pressable>

      {/* Doc selection dialog */}
      <Portal>
        <Dialog visible={showDocPicker} onDismiss={() => setShowDocPicker(false)} style={{ borderRadius: 20 }}>
          <Dialog.Title>Gán vào tài liệu / danh sách</Dialog.Title>
          <Dialog.Content>
            {docs.map((d) => (
              <Pressable
                key={d.id}
                style={styles.dialogDocRow}
                onPress={() => {
                  assignWordToDoc(word.id, d.id);
                  if (onSelectDoc) onSelectDoc(d.id);
                  setShowDocPicker(false);
                }}
              >
                <RadioButton
                  value={d.id}
                  status={word.docId === d.id ? 'checked' : 'unchecked'}
                  onPress={() => {
                    assignWordToDoc(word.id, d.id);
                    if (onSelectDoc) onSelectDoc(d.id);
                    setShowDocPicker(false);
                  }}
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text variant="titleMedium">{d.title}</Text>
                  {!!d.description && <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{d.description}</Text>}
                </View>
              </Pressable>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton icon="close" onPress={() => setShowDocPicker(false)} />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BIG,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  pillBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  posBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  posText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  docBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8DEF8',
    borderRadius: 999,
    paddingRight: 8,
    paddingLeft: 2,
    height: 24,
  },
  docIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
  masteredBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  masteredText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    margin: 0,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordTitle: {
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  chevron: {
    margin: 0,
    width: 28,
    height: 28,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDD',
    gap: 8,
  },
  ipaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defBox: {
    paddingVertical: 2,
  },
  exampleBox: {
    borderRadius: 14,
    padding: 12,
    marginVertical: 4,
  },
  exampleEnText: {
    fontWeight: '600',
    lineHeight: 20,
  },
  collocationsContainer: {
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  colChip: {
    borderRadius: 999,
  },
  dialogDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
});


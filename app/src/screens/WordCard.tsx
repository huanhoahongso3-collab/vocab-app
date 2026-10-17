import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import { Chip, IconButton, Text, useTheme } from 'react-native-paper';
import type { VocabWord } from '../models';
import { BIG } from '../theme';

export function WordCard({ word, saved, onToggleSave }: { word: VocabWord; saved: boolean; onToggleSave: () => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    setOpen((o) => !o);
  };

  return (
    <Pressable
      onPress={toggle}
      style={[styles.card, { backgroundColor: open ? theme.colors.secondaryContainer : theme.colors.elevation.level3 }]}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text variant="titleLarge">{word.word}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {[word.pos, word.meaningVi].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <IconButton icon="volume-high" onPress={() => Speech.speak(word.word, { language: 'en-US' })} accessibilityLabel="Phát âm" />
        <IconButton
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          mode={saved ? 'contained-tonal' : undefined}
          onPress={onToggleSave}
          accessibilityLabel={saved ? 'Bỏ lưu' : 'Lưu từ'}
        />
      </View>
      {open && (
        <View style={{ marginTop: 8, gap: 6 }}>
          {!!word.ipa && <Text style={{ fontStyle: 'italic' }}>{word.ipa}</Text>}
          {!!word.definitionEn && <Text>{word.definitionEn}</Text>}
          <Text variant="bodyLarge">“{word.exampleEn}”</Text>
          {!!word.exampleVi && <Text variant="bodySmall">{word.exampleVi}</Text>}
          {word.collocations.length > 0 && (
            <View style={styles.chips}>
              {word.collocations.map((c) => (
                <Chip key={c} compact style={{ borderRadius: 999 }}>{c}</Chip>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: BIG, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});

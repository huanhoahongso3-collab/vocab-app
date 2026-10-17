import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSaved } from '../store';
import { WordCard } from './WordCard';

export function SavedScreen() {
  const saved = useSaved();
  if (saved.words.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text variant="titleMedium" style={{ textAlign: 'center' }}>Chưa có từ nào</Text>
        <Text style={{ textAlign: 'center', marginTop: 6 }}>Bấm biểu tượng đánh dấu trên thẻ từ để lưu lại.</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 12 }}>{saved.words.length} từ đã lưu</Text>
      {saved.words.map((w) => (
        <WordCard key={w.id} word={w} saved onToggleSave={() => saved.remove(w.id)} />
      ))}
    </ScrollView>
  );
}

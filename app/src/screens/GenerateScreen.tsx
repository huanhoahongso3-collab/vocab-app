import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Dialog, IconButton, Menu, Portal, RadioButton, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { api, ApiError } from '../api';
import type { Me, VocabWord } from '../models';
import { FREE_SAVED_LIMIT, useSaved } from '../store';
import { BIG } from '../theme';
import { WordCard } from './WordCard';

const CEFR_LEVELS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' },
  { value: 'C2', label: 'C2' },
];

export function GenerateScreen({ me, onChanged, notify }: { me: Me; onChanged: () => Promise<void>; notify: (m: string) => void }) {
  const theme = useTheme();
  const { saved, docs, t, lang } = useSaved() as any;
  const store = useSaved();
  const [level, setLevel] = useState('ALL');
  const [topic, setTopic] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [wordCount, setWordCount] = useState(8);
  const [targetDocId, setTargetDocId] = useState<string>(store.docs[0]?.id || 'doc-untitled');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDocDialog, setShowDocDialog] = useState(false);

  useEffect(() => {
    api.topics().then(setTopics).catch(() => {});
  }, []);

  const chosen = custom.trim() || topic;
  const currentDoc = store.docs.find((d) => d.id === targetDocId) || store.docs[0];

  async function generate() {
    if (!chosen) return setError(store.t('topicRequired'));
    setBusy(true);
    setError(null);
    try {
      const generated = await api.generate(level, chosen, wordCount);
      // Attach target doc to generated words
      const withDoc = generated.map((w) => ({ ...w, docId: targetDocId }));
      setWords(withDoc);
      await onChanged();
      notify(store.t('generationSuccess', { count: generated.length }));
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave(w: VocabWord) {
    if (store.has(w.id)) {
      await store.remove(w.id);
    } else {
      const ok = await store.save(w, me.premium, targetDocId);
      if (!ok) notify(`Gói miễn phí lưu tối đa ${FREE_SAVED_LIMIT} từ.`);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>{store.t('heroTitle')}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          {store.t('heroSubtitle')}
        </Text>
      </View>

      {/* Target Document Selector */}
      <View style={[styles.targetDocCard, { backgroundColor: theme.colors.elevation.level1 }]}>
        <View style={{ flex: 1 }}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            {store.t('targetDocLabel')}
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: '700', marginTop: 2 }}>
            {currentDoc?.title || 'Untitled Document'}
          </Text>
        </View>
        <Button
          mode="contained-tonal"
          icon="folder-outline"
          compact
          onPress={() => setShowDocDialog(true)}
          style={{ borderRadius: 999 }}
        >
          Đổi
        </Button>
      </View>

      {/* CEFR Level Selector (A1 -> C2) */}
      <Text variant="titleMedium" style={styles.label}>{store.t('levelLabel')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>
        {CEFR_LEVELS.map((item) => {
          const isSelected = level === item.value;
          return (
            <Chip
              key={item.value}
              selected={isSelected}
              showSelectedCheck
              mode={isSelected ? 'flat' : 'outlined'}
              onPress={() => setLevel(item.value)}
              style={[styles.levelChip, isSelected && { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={[styles.levelChipText, isSelected && { color: theme.colors.onPrimaryContainer, fontWeight: '700' }]}
            >
              {item.value === 'ALL' ? (store.lang === 'en' ? 'All (A1-C2)' : 'Tất cả (A1-C2)') : item.label}
            </Chip>
          );
        })}
      </ScrollView>

      {/* Word Count */}
      <View style={styles.wordCountRow}>
        <Text variant="titleMedium" style={{ flex: 1 }}>{store.t('wordCountLabel')}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[5, 8, 12, 16].map((num) => (
            <Chip
              key={num}
              compact
              selected={wordCount === num}
              onPress={() => setWordCount(num)}
              style={{ borderRadius: 999 }}
            >
              {num}
            </Chip>
          ))}
        </View>
      </View>

      {/* Topics */}
      <Text variant="titleMedium" style={styles.label}>{store.t('topicLabel')}</Text>
      <View style={styles.chips}>
        {topics.map((t) => (
          <Chip
            key={t}
            selected={topic === t && !custom.trim()}
            showSelectedCheck
            onPress={() => {
              setTopic(t);
              setCustom('');
            }}
            style={styles.chip}
          >
            {t}
          </Chip>
        ))}
      </View>

      {/* Custom Topic Input */}
      <TextInput
        mode="outlined"
        placeholder={store.t('customTopicPlaceholder')}
        value={custom}
        onChangeText={setCustom}
        maxLength={60}
        left={<TextInput.Icon icon="pencil-outline" />}
        outlineStyle={{ borderRadius: BIG }}
        style={{ marginTop: 12 }}
      />

      {/* CTA Button */}
      <Button
        mode="contained"
        icon="sparkles"
        onPress={generate}
        disabled={busy}
        loading={busy}
        contentStyle={styles.bigBtn}
        style={styles.cta}
        labelStyle={{ fontSize: 16, fontWeight: '700' }}
      >
        {busy ? store.t('btnGenerating') : `${store.t('btnGenerate')} (${wordCount} từ)`}
      </Button>

      <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 8, color: theme.colors.outline }}>
        {store.t('remainingQuota', { remaining: me.quotaRemaining, limit: me.quotaLimit })}
      </Text>

      {error && <Text style={{ color: theme.colors.error, marginTop: 8, textAlign: 'center' }}>{error}</Text>}

      {/* Generated Cards */}
      <View style={{ marginTop: 20 }}>
        {words.map((w) => (
          <WordCard
            key={w.id}
            word={w}
            saved={store.has(w.id)}
            onToggleSave={() => toggleSave(w)}
            onSelectDoc={(dId) => {
              setWords((prev) => prev.map((item) => (item.id === w.id ? { ...item, docId: dId } : item)));
            }}
          />
        ))}
      </View>

      {/* Target doc dialog */}
      <Portal>
        <Dialog visible={showDocDialog} onDismiss={() => setShowDocDialog(false)} style={{ borderRadius: 20 }}>
          <Dialog.Title>{store.t('targetDocLabel')}</Dialog.Title>
          <Dialog.Content>
            {store.docs.map((d) => (
              <RadioButton.Item
                key={d.id}
                label={d.title}
                value={d.id}
                status={targetDocId === d.id ? 'checked' : 'unchecked'}
                onPress={() => {
                  setTargetDocId(d.id);
                  setShowDocDialog(false);
                }}
              />
            ))}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 50 },
  header: { marginBottom: 16 },
  headerTitle: { fontWeight: '800', letterSpacing: -0.5 },
  targetDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  label: { marginTop: 14, marginBottom: 8, fontWeight: '700' },
  levelRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  levelChip: { borderRadius: 999 },
  levelChipText: { fontSize: 13 },
  wordCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999 },
  bigBtn: { height: 54 },
  cta: { marginTop: 18, borderRadius: 999 },
});


import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { api, ApiError } from '../api';
import type { Me, VocabWord } from '../models';
import { FREE_SAVED_LIMIT, useSaved } from '../store';
import { BIG } from '../theme';
import { WordCard } from './WordCard';

export function GenerateScreen({ me, onChanged, notify }: { me: Me; onChanged: () => Promise<void>; notify: (m: string) => void }) {
  const theme = useTheme();
  const saved = useSaved();
  const [level, setLevel] = useState('B2');
  const [topic, setTopic] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.topics().then(setTopics).catch(() => {});
  }, []);

  const chosen = custom.trim() || topic;
  const upsell = (m: string) => notify(`${m} Vào tab Tài khoản để nâng cấp Premium.`);

  async function generate() {
    if (!chosen) return setError('Hãy chọn hoặc nhập một chủ đề.');
    setBusy(true);
    setError(null);
    try {
      setWords(await api.generate(level, chosen, me.maxWordsPerGen));
      await onChanged(); // refresh remaining quota
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'premium_required') upsell(err.message);
      else setError(err.code === 'quota_exceeded' ? 'Bạn đã dùng hết lượt hôm nay. Quay lại vào ngày mai hoặc nâng cấp Premium.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave(w: VocabWord) {
    if (saved.has(w.id)) await saved.remove(w.id);
    else if (!(await saved.save(w, me.premium))) upsell(`Gói miễn phí lưu tối đa ${FREE_SAVED_LIMIT} từ.`);
  }

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text variant="headlineMedium">Học từ vựng{'\n'}B2 · C1</Text>

      <Text variant="titleMedium" style={styles.label}>Level</Text>
      <SegmentedButtons
        value={level}
        onValueChange={(v) => (me.levels.includes(v) ? setLevel(v) : upsell(`Level ${v} chỉ có trong Premium.`))}
        buttons={[
          { value: 'B2', label: 'B2' },
          { value: 'C1', label: 'C1', icon: me.levels.includes('C1') ? undefined : 'lock' },
        ]}
      />

      <Text variant="titleMedium" style={styles.label}>Chủ đề</Text>
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
      <TextInput
        mode="outlined"
        label={me.customTopics ? 'Hoặc nhập chủ đề bất kỳ' : 'Chủ đề tự nhập (Premium)'}
        value={custom}
        onChangeText={setCustom}
        disabled={!me.customTopics}
        maxLength={60}
        left={me.customTopics ? undefined : <TextInput.Icon icon="lock" />}
        outlineStyle={{ borderRadius: BIG }}
        style={{ marginTop: 12 }}
      />

      <Button
        mode="contained"
        icon="auto-fix"
        onPress={generate}
        disabled={busy}
        contentStyle={styles.bigBtn}
        style={styles.cta}
        labelStyle={{ fontSize: 17, fontWeight: '700' }}
      >
        {busy ? 'AI đang tạo…' : `Tạo ${me.maxWordsPerGen} từ`}
      </Button>
      <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 6 }}>
        Còn {me.quotaRemaining}/{me.quotaLimit} lượt hôm nay
      </Text>
      {busy && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: theme.colors.error, marginTop: 8 }}>{error}</Text>}

      <View style={{ marginTop: 16 }}>
        {words.map((w) => (
          <WordCard key={w.id} word={w} saved={saved.has(w.id)} onToggleSave={() => toggleSave(w)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40 },
  label: { marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999 },
  bigBtn: { height: 58 },
  cta: { marginTop: 20, borderRadius: 999 },
});

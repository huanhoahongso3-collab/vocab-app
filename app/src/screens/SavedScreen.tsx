import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, FAB, IconButton, Menu, Portal, Searchbar, Text, TextInput, useTheme } from 'react-native-paper';
import type { VocabWord } from '../models';
import { useSaved } from '../store';
import { BIG } from '../theme';
import { WordCard } from './WordCard';

export function SavedScreen() {
  const theme = useTheme();
  const { words, docs, remove, createDoc, updateDoc, deleteDoc, addCustomWord, t, lang } = useSaved();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // New Document modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('Untitled Document');
  const [newDocDesc, setNewDocDesc] = useState('');

  // Add Custom Word modal
  const [showWordModal, setShowWordModal] = useState(false);
  const [newWordText, setNewWordText] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newIpa, setNewIpa] = useState('');
  const [newPos, setNewPos] = useState('noun');
  const [newExEn, setNewExEn] = useState('');
  const [newExVi, setNewExVi] = useState('');
  const [newLevel, setNewLevel] = useState('B2');

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // Document filter
      if (selectedDocId && w.docId !== selectedDocId) return false;
      // Level filter
      if (selectedLevel && w.level !== selectedLevel) return false;
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchWord = w.word.toLowerCase().includes(q);
        const matchMeaning = w.meaningVi.toLowerCase().includes(q);
        const matchTopic = (w.topic || '').toLowerCase().includes(q);
        return matchWord || matchMeaning || matchTopic;
      }
      return true;
    });
  }, [words, selectedDocId, selectedLevel, searchQuery]);

  const handleCreateDoc = async () => {
    if (!newDocTitle.trim()) return;
    await createDoc(newDocTitle.trim(), newDocDesc.trim());
    setNewDocTitle('Untitled Document');
    setNewDocDesc('');
    setShowDocModal(false);
  };

  const handleAddWord = async () => {
    if (!newWordText.trim() || !newMeaning.trim()) return;
    await addCustomWord({
      word: newWordText,
      meaningVi: newMeaning,
      ipa: newIpa,
      pos: newPos,
      exampleEn: newExEn,
      exampleVi: newExVi,
      level: newLevel,
      docId: selectedDocId || docs[0]?.id,
    });
    setNewWordText('');
    setNewMeaning('');
    setNewIpa('');
    setNewExEn('');
    setNewExVi('');
    setShowWordModal(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Title & Actions Bar */}
        <View style={styles.headerRow}>
          <View>
            <Text variant="headlineSmall" style={styles.title}>{t('savedTitle')}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
              {words.length} {t('savedWord').toLowerCase()}
            </Text>
          </View>
          <Button
            mode="contained-tonal"
            icon="plus"
            compact
            onPress={() => setShowWordModal(true)}
            style={{ borderRadius: 999 }}
          >
            {t('newWordBtn')}
          </Button>
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder={t('searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={{ fontSize: 14 }}
        />

        {/* Custom Documents Bar */}
        <View style={styles.sectionDocHeader}>
          <Text variant="labelMedium" style={{ fontWeight: '700', color: theme.colors.outline }}>
            DANH SÁCH & TÀI LIỆU
          </Text>
          <Button
            mode="text"
            icon="plus"
            compact
            onPress={() => setShowDocModal(true)}
            labelStyle={{ fontSize: 12 }}
          >
            {t('newDocBtn')}
          </Button>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docsScroll}>
          {/* All chip */}
          <Chip
            selected={selectedDocId === null}
            showSelectedCheck
            onPress={() => setSelectedDocId(null)}
            style={styles.docChip}
          >
            {t('allDocs')} ({words.length})
          </Chip>

          {/* Docs chips */}
          {docs.map((doc) => {
            const count = words.filter((w) => w.docId === doc.id).length;
            const isSelected = selectedDocId === doc.id;
            return (
              <Chip
                key={doc.id}
                selected={isSelected}
                showSelectedCheck
                icon="file-document-outline"
                onPress={() => setSelectedDocId(isSelected ? null : doc.id)}
                style={[styles.docChip, isSelected && { backgroundColor: theme.colors.secondaryContainer }]}
              >
                {doc.title} ({count})
              </Chip>
            );
          })}
        </ScrollView>

        {/* Level Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelFilterRow}>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => {
            const isSelected = selectedLevel === lvl;
            return (
              <Chip
                key={lvl}
                compact
                selected={isSelected}
                onPress={() => setSelectedLevel(isSelected ? null : lvl)}
                style={styles.levelFilterChip}
              >
                {lvl}
              </Chip>
            );
          })}
        </ScrollView>

        {/* Word Cards List */}
        {filteredWords.length === 0 ? (
          <View style={styles.emptyState}>
            <IconButton icon="folder-open-outline" size={54} iconColor={theme.colors.outline} />
            <Text variant="titleMedium" style={{ fontWeight: '700', marginTop: 4 }}>
              {t('emptySavedTitle')}
            </Text>
            <Text style={{ color: theme.colors.outline, textAlign: 'center', marginTop: 4 }}>
              {t('emptySavedDesc')}
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>
            {filteredWords.map((w) => (
              <WordCard
                key={w.id}
                word={w}
                saved
                onToggleSave={() => remove(w.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Create Document */}
      <Portal>
        <Dialog visible={showDocModal} onDismiss={() => setShowDocModal(false)} style={{ borderRadius: 20 }}>
          <Dialog.Title>{t('createDocTitle')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label={t('docNamePlaceholder')}
              value={newDocTitle}
              onChangeText={setNewDocTitle}
              style={{ marginBottom: 12 }}
            />
            <TextInput
              mode="outlined"
              label={t('docDescPlaceholder')}
              value={newDocDesc}
              onChangeText={setNewDocDesc}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDocModal(false)}>Hủy</Button>
            <Button mode="contained" onPress={handleCreateDoc}>Tạo tài liệu</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal: Add Custom Word */}
      <Portal>
        <Dialog visible={showWordModal} onDismiss={() => setShowWordModal(false)} style={{ borderRadius: 20 }}>
          <Dialog.Title>{t('addWordTitle')}</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 420 }}>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              <TextInput
                mode="outlined"
                label={t('wordLabel')}
                value={newWordText}
                onChangeText={setNewWordText}
                style={{ marginBottom: 8 }}
              />
              <TextInput
                mode="outlined"
                label={t('meaningLabel')}
                value={newMeaning}
                onChangeText={setNewMeaning}
                style={{ marginBottom: 8 }}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TextInput
                  mode="outlined"
                  label={t('ipaLabel')}
                  value={newIpa}
                  onChangeText={setNewIpa}
                  style={{ flex: 1 }}
                />
                <TextInput
                  mode="outlined"
                  label={t('posLabel')}
                  value={newPos}
                  onChangeText={setNewPos}
                  style={{ flex: 1 }}
                />
              </View>
              <TextInput
                mode="outlined"
                label={t('exampleEnLabel')}
                value={newExEn}
                onChangeText={setNewExEn}
                style={{ marginBottom: 8 }}
              />
              <TextInput
                mode="outlined"
                label={t('exampleViLabel')}
                value={newExVi}
                onChangeText={setNewExVi}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowWordModal(false)}>Hủy</Button>
            <Button mode="contained" onPress={handleAddWord}>{t('btnSaveWord')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchbar: {
    borderRadius: 14,
    elevation: 1,
    marginBottom: 12,
  },
  sectionDocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  docsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  docChip: {
    borderRadius: 999,
  },
  levelFilterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 8,
  },
  levelFilterChip: {
    borderRadius: 999,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});


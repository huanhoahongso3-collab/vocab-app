import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import type { CustomDoc, ReminderSettings, UserSettings, VocabWord } from './models';

export const FREE_SAVED_LIMIT = 100;

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: true,
  time: '20:00',
  message: 'Đã đến giờ ôn lại từ vựng hôm nay! 🚀',
  streakDays: 3,
  lastStudiedDate: new Date().toISOString().slice(0, 10),
  dailyGoal: 10,
  reviewedToday: 4,
  autoSpeak: true,
};

import { translations, type Lang } from './i18n';

export const DEFAULT_SETTINGS: UserSettings = {
  defaultLevel: 'ALL',
  showIpa: true,
  showViExample: true,
  lang: 'vi',
};

const DEFAULT_DOCS: CustomDoc[] = [
  {
    id: 'doc-untitled',
    title: 'Untitled Document',
    description: 'Tài liệu từ vựng mặc định / Default document',
    color: '#6750A4',
    icon: 'file-document-outline',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'doc-ielts',
    title: 'IELTS Focus B2/C1',
    description: 'Từ vựng trọng tâm bài thi IELTS / Key IELTS Vocab',
    color: '#006A6A',
    icon: 'school-outline',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
  },
];

interface SavedCtx {
  words: VocabWord[]; // not deleted, newest first
  has: (id: string) => boolean;
  save: (w: VocabWord, premium?: boolean, docId?: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  addCustomWord: (data: { word: string; meaningVi: string; ipa?: string; pos?: string; exampleEn?: string; exampleVi?: string; level?: string; topic?: string; docId?: string }) => Promise<VocabWord>;
  assignWordToDoc: (wordId: string, docId?: string) => Promise<void>;
  markWordReviewed: (wordId: string, remembered: boolean) => Promise<void>;
  docs: CustomDoc[];
  createDoc: (title?: string, description?: string, color?: string, icon?: string) => Promise<CustomDoc>;
  updateDoc: (id: string, patch: Partial<CustomDoc>) => Promise<void>;
  deleteDoc: (id: string) => Promise<void>;
  reminder: ReminderSettings;
  updateReminder: (patch: Partial<ReminderSettings>) => Promise<void>;
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  t: (key: keyof typeof translations['vi'], params?: Record<string, string | number>) => string;
  lang: Lang;
  setLang: (lang: Lang) => Promise<void>;
  clear: () => Promise<void>;
  sync: () => Promise<void>;
}

const Ctx = createContext<SavedCtx>(null as unknown as SavedCtx);
export const useSaved = () => useContext(Ctx);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [all, setAll] = useState<Record<string, VocabWord>>({});
  const ref = useRef(all);
  ref.current = all;

  const [docs, setDocs] = useState<CustomDoc[]>(DEFAULT_DOCS);
  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  const persistWords = useCallback(async (next: Record<string, VocabWord>) => {
    ref.current = next;
    setAll(next);
    await AsyncStorage.setItem('saved_words', JSON.stringify(Object.values(next)));
  }, []);

  const persistDocs = useCallback(async (nextDocs: CustomDoc[]) => {
    setDocs(nextDocs);
    await AsyncStorage.setItem('custom_docs', JSON.stringify(nextDocs));
  }, []);

  const persistReminder = useCallback(async (nextRem: ReminderSettings) => {
    setReminder(nextRem);
    await AsyncStorage.setItem('reminder_settings', JSON.stringify(nextRem));
  }, []);

  const persistSettings = useCallback(async (nextSet: UserSettings) => {
    setSettings(nextSet);
    await AsyncStorage.setItem('user_settings', JSON.stringify(nextSet));
  }, []);

  useEffect(() => {
    // Load words
    AsyncStorage.getItem('saved_words').then((raw) => {
      if (!raw) return;
      try {
        const map: Record<string, VocabWord> = {};
        for (const w of JSON.parse(raw) as VocabWord[]) map[w.id] = w;
        ref.current = map;
        setAll(map);
      } catch {}
    });

    // Load docs
    AsyncStorage.getItem('custom_docs').then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setDocs(parsed);
      } catch {}
    });

    // Load reminder
    AsyncStorage.getItem('reminder_settings').then((raw) => {
      if (!raw) return;
      try {
        setReminder({ ...DEFAULT_REMINDER, ...JSON.parse(raw) });
      } catch {}
    });

    // Load settings
    AsyncStorage.getItem('user_settings').then((raw) => {
      if (!raw) return;
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      } catch {}
    });
  }, []);

  const words = useMemo(() => Object.values(all).filter((w) => !w.deleted).sort((a, b) => b.updatedAt - a.updatedAt), [all]);

  const value: SavedCtx = {
    words,
    has: (id) => !!all[id] && !all[id].deleted,
    async save(w, premium = true, docId) {
      const cur = ref.current;
      const exists = cur[w.id] && !cur[w.id].deleted;
      if (!exists && !premium && words.length >= FREE_SAVED_LIMIT) return false;
      const doc = docId ?? (cur[w.id]?.docId || docs[0]?.id || 'doc-untitled');
      await persistWords({ ...cur, [w.id]: { ...w, docId: doc, updatedAt: Date.now(), deleted: false } });
      return true;
    },
    async remove(id) {
      const w = ref.current[id];
      if (w) await persistWords({ ...ref.current, [id]: { ...w, updatedAt: Date.now(), deleted: true } });
    },
    async addCustomWord(data) {
      const id = `custom:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;
      const newWord: VocabWord = {
        id,
        word: data.word.trim(),
        meaningVi: data.meaningVi.trim(),
        ipa: data.ipa?.trim() || '',
        pos: data.pos?.trim() || 'noun',
        definitionEn: '',
        exampleEn: data.exampleEn?.trim() || '',
        exampleVi: data.exampleVi?.trim() || '',
        collocations: [],
        level: data.level || 'B2',
        topic: data.topic || 'Tự nhập',
        docId: data.docId || docs[0]?.id || 'doc-untitled',
        updatedAt: Date.now(),
        deleted: false,
        mastered: false,
        reviewCount: 0,
      };
      await persistWords({ ...ref.current, [id]: newWord });
      return newWord;
    },
    async assignWordToDoc(wordId, docId) {
      const w = ref.current[wordId];
      if (w) {
        await persistWords({ ...ref.current, [wordId]: { ...w, docId, updatedAt: Date.now() } });
      }
    },
    async markWordReviewed(wordId, remembered) {
      const w = ref.current[wordId];
      if (w) {
        const nextReviewCount = (w.reviewCount || 0) + 1;
        const nextMastered = remembered ? (w.mastered || nextReviewCount >= 3) : false;
        await persistWords({
          ...ref.current,
          [wordId]: {
            ...w,
            reviewCount: nextReviewCount,
            mastered: nextMastered,
            lastReviewedAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      }

      // Update today's reviewed count and streak
      const today = new Date().toISOString().slice(0, 10);
      setReminder((prev) => {
        const isNewDay = prev.lastStudiedDate !== today;
        const nextReviewedToday = isNewDay ? 1 : prev.reviewedToday + 1;
        const nextStreak = isNewDay ? prev.streakDays + 1 : prev.streakDays;
        const updated: ReminderSettings = {
          ...prev,
          reviewedToday: nextReviewedToday,
          streakDays: nextStreak,
          lastStudiedDate: today,
        };
        AsyncStorage.setItem('reminder_settings', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    docs,
    async createDoc(title = 'Untitled Document', description = '', color = '#6750A4', icon = 'file-document-outline') {
      const newDoc: CustomDoc = {
        id: `doc-${Date.now()}`,
        title: title.trim() || 'Untitled Document',
        description: description.trim(),
        color,
        icon,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const next = [newDoc, ...docs];
      await persistDocs(next);
      return newDoc;
    },
    async updateDoc(id, patch) {
      const next = docs.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d));
      await persistDocs(next);
    },
    async deleteDoc(id) {
      const next = docs.filter((d) => d.id !== id);
      await persistDocs(next);
      // Unassign words in deleted doc
      const nextWords = { ...ref.current };
      for (const k in nextWords) {
        if (nextWords[k].docId === id) {
          nextWords[k] = { ...nextWords[k], docId: undefined, updatedAt: Date.now() };
        }
      }
      await persistWords(nextWords);
    },
    reminder,
    async updateReminder(patch) {
      const next = { ...reminder, ...patch };
      await persistReminder(next);
    },
    settings,
    async updateSettings(patch) {
      const next = { ...settings, ...patch };
      await persistSettings(next);
    },
    lang: settings.lang,
    async setLang(l: Lang) {
      const next = { ...settings, lang: l };
      await persistSettings(next);
    },
    t(key: keyof typeof translations['vi'], params?: Record<string, string | number>) {
      const currentLang = settings.lang || 'vi';
      let str = translations[currentLang][key] || translations.vi[key] || String(key);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return str;
    },
    async clear() {
      await persistWords({});
      await persistDocs(DEFAULT_DOCS);
      await persistReminder(DEFAULT_REMINDER);
      await AsyncStorage.multiRemove(['sync_cursor', 'sync_pushed']);
    },
    async sync() {
      const pushedAt = Number((await AsyncStorage.getItem('sync_pushed')) ?? 0);
      const cursor = Number((await AsyncStorage.getItem('sync_cursor')) ?? 0);
      const startedAt = Date.now();
      const res = await api.sync(cursor, Object.values(ref.current).filter((w) => w.updatedAt > pushedAt));
      const next = { ...ref.current };
      for (const remote of res.changes) {
        const local = next[remote.id];
        if (!local || remote.updatedAt >= local.updatedAt) next[remote.id] = remote;
      }
      await AsyncStorage.multiSet([['sync_cursor', String(res.cursor)], ['sync_pushed', String(startedAt)]]);
      await persistWords(next);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

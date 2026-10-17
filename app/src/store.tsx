import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import type { VocabWord } from './models';

export const FREE_SAVED_LIMIT = 100;

interface SavedCtx {
  words: VocabWord[]; // not deleted, newest first
  has: (id: string) => boolean;
  /** Returns false when the free-plan limit is reached. */
  save: (w: VocabWord, premium: boolean) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  sync: () => Promise<void>;
}

const Ctx = createContext<SavedCtx>(null as unknown as SavedCtx);
export const useSaved = () => useContext(Ctx);

/**
 * Offline-first saved words: every change is written locally first, then pushed by `sync`
 * (Premium only). Conflicts are last-write-wins on `updatedAt`, same as the server.
 */
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [all, setAll] = useState<Record<string, VocabWord>>({});
  const ref = useRef(all);
  ref.current = all;

  const persist = useCallback(async (next: Record<string, VocabWord>) => {
    ref.current = next;
    setAll(next);
    await AsyncStorage.setItem('saved_words', JSON.stringify(Object.values(next)));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('saved_words').then((raw) => {
      if (!raw) return;
      const map: Record<string, VocabWord> = {};
      for (const w of JSON.parse(raw) as VocabWord[]) map[w.id] = w;
      ref.current = map;
      setAll(map);
    });
  }, []);

  const words = useMemo(() => Object.values(all).filter((w) => !w.deleted).sort((a, b) => b.updatedAt - a.updatedAt), [all]);

  const value: SavedCtx = {
    words,
    has: (id) => !!all[id] && !all[id].deleted,
    async save(w, premium) {
      const cur = ref.current;
      const exists = cur[w.id] && !cur[w.id].deleted;
      if (!exists && !premium && words.length >= FREE_SAVED_LIMIT) return false;
      await persist({ ...cur, [w.id]: { ...w, updatedAt: Date.now(), deleted: false } });
      return true;
    },
    async remove(id) {
      const w = ref.current[id];
      if (w) await persist({ ...ref.current, [id]: { ...w, updatedAt: Date.now(), deleted: true } });
    },
    async clear() {
      await persist({});
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
      await persist(next);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

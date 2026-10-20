export interface CustomDoc {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // e.g. "20:00"
  message: string; // customized reminder text
  streakDays: number;
  lastStudiedDate: string; // "YYYY-MM-DD"
  dailyGoal: number; // e.g. 10 words
  reviewedToday: number;
  autoSpeak: boolean; // auto play pronunciation on flashcards
}

export interface UserSettings {
  defaultLevel: string; // 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', or 'ALL'
  showIpa: boolean;
  showViExample: boolean;
  lang: 'vi' | 'en';
}

export interface VocabWord {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  meaningVi: string;
  definitionEn: string;
  exampleEn: string;
  exampleVi: string;
  collocations: string[];
  level: string;
  topic: string;
  updatedAt: number;
  deleted: boolean;
  docId?: string; // id of CustomDoc ("untitled document", etc.)
  mastered?: boolean;
  lastReviewedAt?: number;
  reviewCount?: number;
}

/** Deterministic id so the same word saved on two devices merges instead of duplicating. */
export const makeId = (level: string, word: string) => `${level}:${word.trim().toLowerCase()}`;

export function wordFromApi(j: any, level: string, topic: string): VocabWord {
  return {
    id: makeId(level, j.word),
    word: j.word,
    ipa: j.ipa ?? '',
    pos: j.pos ?? '',
    meaningVi: j.meaning_vi ?? '',
    definitionEn: j.definition_en ?? '',
    exampleEn: j.example_en ?? '',
    exampleVi: j.example_vi ?? '',
    collocations: j.collocations ?? [],
    level,
    topic,
    updatedAt: Date.now(),
    deleted: false,
    mastered: false,
    reviewCount: 0,
  };
}

/** Shape stored in the server's `data` blob. */
export const wordToData = (w: VocabWord) => ({
  word: w.word, ipa: w.ipa, pos: w.pos, meaning_vi: w.meaningVi, definition_en: w.definitionEn,
  example_en: w.exampleEn, example_vi: w.exampleVi, collocations: w.collocations, level: w.level, topic: w.topic,
  doc_id: w.docId, mastered: w.mastered,
});

export const wordToChange = (w: VocabWord) => ({ id: w.id, data: wordToData(w), updated_at: w.updatedAt, deleted: w.deleted });

export function wordFromChange(c: any): VocabWord {
  const d = c.data ?? {};
  return {
    id: c.id, word: d.word ?? '', ipa: d.ipa ?? '', pos: d.pos ?? '', meaningVi: d.meaning_vi ?? '',
    definitionEn: d.definition_en ?? '', exampleEn: d.example_en ?? '', exampleVi: d.example_vi ?? '',
    collocations: d.collocations ?? [], level: d.level ?? 'B2', topic: d.topic ?? '',
    docId: d.doc_id, mastered: !!d.mastered,
    updatedAt: c.updated_at, deleted: !!c.deleted,
  };
}

export interface Me {
  email: string;
  name: string;
  emailVerified: boolean;
  premium: boolean;
  expiresAt: number | null;
  quotaRemaining: number;
  quotaLimit: number;
  maxWordsPerGen: number;
  levels: string[];
  customTopics: boolean;
  canSync: boolean;
}

export function meFromApi(j: any): Me {
  return {
    email: j.user.email,
    name: j.user.name ?? '',
    emailVerified: !!j.user.email_verified,
    premium: j.plan === 'premium',
    expiresAt: j.expires_at ?? null,
    quotaRemaining: j.quota.remaining,
    quotaLimit: j.quota.limit,
    maxWordsPerGen: j.limits.maxWordsPerGen,
    levels: j.limits.levels,
    customTopics: j.limits.customTopics,
    canSync: j.limits.sync,
  };
}

/** Local demo account: everything unlocked, no server involved. */
export const demoMe: Me = {
  email: 'demo@local', name: 'Demo Học Viên', emailVerified: true, premium: true, expiresAt: null,
  quotaRemaining: 99, quotaLimit: 99, maxWordsPerGen: 12, levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], customTopics: true, canSync: false,
};

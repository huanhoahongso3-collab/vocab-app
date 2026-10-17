import { z } from 'zod';
import type { Config } from './config.js';
import type { Level } from './limits.js';

export const WordSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().default(''),
  pos: z.string().default(''),
  meaning_vi: z.string().min(1),
  definition_en: z.string().default(''),
  example_en: z.string().min(1),
  example_vi: z.string().default(''),
  collocations: z.array(z.string()).default([]),
});
export type VocabWord = z.infer<typeof WordSchema>;

export interface VocabAi {
  generate(level: Level, topic: string, count: number, exclude: string[]): Promise<unknown>;
}

const SYSTEM = 'You are a raw JSON generator. Output ONLY valid JSON, no markdown, no commentary.';

function buildPrompt(level: Level, topic: string, count: number, exclude: string[]): string {
  const skip = exclude.length ? `\nKhông lặp lại các từ sau: ${exclude.join(', ')}.` : '';
  return `Hãy tạo ${count} từ vựng tiếng Anh trình độ CEFR ${level} (từ học thuật/nâng cao, không quá cơ bản) thuộc chủ đề "${topic}".${skip}
Trả về JSON đúng dạng:
{"words":[{"word":"","ipa":"","pos":"noun|verb|adjective|adverb|...","meaning_vi":"nghĩa tiếng Việt ngắn gọn","definition_en":"English definition","example_en":"một câu ví dụ tự nhiên","example_vi":"bản dịch tiếng Việt của câu ví dụ","collocations":["2-3 cụm từ đi kèm"]}]}
Chỉ trả về JSON.`;
}

/** Calls the same OpenAI-compatible endpoint/model/key as cbh-youth-online's AiChatService. */
export function createAi(cfg: Config, fetchImpl: typeof fetch = fetch): VocabAi {
  return {
    async generate(level, topic, count, exclude) {
      if (!cfg.aiKey) throw new Error('AI key not configured');
      const res = await fetchImpl(cfg.aiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.aiKey}` },
        body: JSON.stringify({
          model: cfg.aiModel,
          temperature: 0.4,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: buildPrompt(level, topic, count, exclude) },
          ],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
      const json: any = await res.json();
      return json?.choices?.[0]?.message?.content;
    },
  };
}

/** Strips code fences, parses JSON and keeps only valid, unique words. */
export function parseWords(raw: unknown, exclude: string[] = []): VocabWord[] {
  if (typeof raw !== 'string') return [];
  let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) return [];
  text = text.slice(start, end + 1);
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const seen = new Set(exclude.map((w) => w.toLowerCase()));
  const out: VocabWord[] = [];
  for (const item of Array.isArray(parsed?.words) ? parsed.words : []) {
    const r = WordSchema.safeParse(item);
    if (!r.success) continue;
    const key = r.data.word.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...r.data, word: r.data.word.trim() });
  }
  return out;
}

/** Asks the AI up to 3 times (top-up for missing/invalid words), like QuizGenerationService. */
export async function generateWords(ai: VocabAi, level: Level, topic: string, count: number): Promise<VocabWord[]> {
  const words: VocabWord[] = [];
  let lastError: unknown;
  for (let attempt = 0; attempt < 3 && words.length < count; attempt++) {
    const exclude = words.map((w) => w.word);
    try {
      const raw = await ai.generate(level, topic, count - words.length, exclude);
      words.push(...parseWords(raw, exclude));
    } catch (e) {
      lastError = e;
    }
  }
  if (words.length === 0) throw lastError ?? new Error('AI returned no valid words');
  return words.slice(0, count);
}

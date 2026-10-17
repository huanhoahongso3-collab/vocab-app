export type Plan = 'free' | 'premium';
export type Level = 'B2' | 'C1';

export interface PlanLimits {
  gensPerDay: number;
  maxWordsPerGen: number;
  levels: Level[];
  customTopics: boolean;
  fullCards: boolean;
  sync: boolean;
}

export const LIMITS: Record<Plan, PlanLimits> = {
  free: { gensPerDay: 3, maxWordsPerGen: 8, levels: ['B2'], customTopics: false, fullCards: false, sync: false },
  premium: { gensPerDay: 30, maxWordsPerGen: 20, levels: ['B2', 'C1'], customTopics: true, fullCards: true, sync: true },
};

export const PRESET_TOPICS = [
  'Công nghệ', 'Môi trường', 'Giáo dục', 'Sức khỏe', 'Du lịch', 'Kinh doanh',
  'Technology', 'Environment', 'Education', 'Health', 'Travel', 'Business',
];

/** Day key in Vietnam time (UTC+7) so quotas reset at local midnight. */
export function dayKey(now = Date.now()): string {
  return new Date(now + 7 * 3600_000).toISOString().slice(0, 10);
}

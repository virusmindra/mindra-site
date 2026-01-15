// src/lib/mindra/memoryTypes.ts
export type Mood = "happy" | "neutral" | "sad" | "anxious" | "tired" | "excited";

export type MemoryEvent = {
  key: string;                 // "fired_job" | "reconciled_father" | etc.
  text: string;                // человеческое описание
  emotion: "positive" | "negative";
  ts: number;                  // Date.now()
  followUpAfterDays?: number[]; // [1,3] -> спросить через 1 и 3 дня
  lastFollowUpTs?: number | null;
};

export type UserMemory = {
  version: 1;
  userId: string;
  name?: string;
  moodBaseline?: Mood;
  life?: "working" | "studying" | "both" | "other";
  relationship?: "single" | "in_relationship" | "complicated" | "prefer_not";
  topics?: string[];       // лёгкие темы: ["work","family","gym"]
  events?: MemoryEvent[];  // 3–5 последних
  createdAt: number;
  updatedAt: number;
};

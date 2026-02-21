// domain/models/WorkoutPreset.ts
export type WorkoutPreset = {
  id: string;
  name: string;
  sets: number;
  exerciseSeconds: number;
  restSeconds: number;
  exerciseAutoAdvance: boolean;
  restAutoAdvance: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type WorkoutPresetInput = Omit<WorkoutPreset, "id" | "createdAt" | "updatedAt">;

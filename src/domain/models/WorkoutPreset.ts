// src/domain/models/WorkoutPreset.ts
export type WorkoutPreset = {
  id: string;
  name: string;
  sets: number;
  exerciseSeconds: number;
  restSeconds: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  // TODO: incluir colores de pantalla para exercise y rest
};

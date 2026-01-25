// src/services/storage.ts
import { WorkoutPreset } from "../domain/models/WorkoutPreset";

export interface PresetStorage {
  list(): Promise<WorkoutPreset[]>;
  save(preset: WorkoutPreset): Promise<void>;
  remove(id: string): Promise<void>;
}

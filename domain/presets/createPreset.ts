import type { WorkoutPreset, WorkoutPresetInput } from "../models/WorkoutPreset";
import { validatePreset } from "../validators/validatePreset";
import { createId } from "../../utils/id";

export function createPreset(input: WorkoutPresetInput): WorkoutPreset {
  const valid = validatePreset(input);
  const now = new Date().toISOString();
  return {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...valid,
  };
}

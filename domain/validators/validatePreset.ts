// domain/validators/validatePreset.ts
import type { WorkoutPresetInput } from "../models/WorkoutPreset";
import { validateTimerConfig } from "./validateTimerConfig";

export function validatePreset(input: WorkoutPresetInput) {
  const name = input.name.trim();
  if (!name) throw new Error("El nombre no puede estar vacío.");
  const config = validateTimerConfig({
    sets: input.sets,
    exerciseSeconds: input.exerciseSeconds,
    restSeconds: input.restSeconds,
    exerciseAutoAdvance: input.exerciseAutoAdvance,
    restAutoAdvance: input.restAutoAdvance,
  });
  return { ...config, name };
}

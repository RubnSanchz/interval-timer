// src/domain/validators/validatePreset.ts
import { WorkoutPreset } from "../models/WorkoutPreset";

export function validatePreset(input: Omit<WorkoutPreset, "id" | "createdAt" | "updatedAt">) {
  const name = input.name.trim();
  if (!name) throw new Error("El nombre no puede estar vacío.");
  if (!Number.isInteger(input.sets) || input.sets < 1) throw new Error("Sets debe ser un entero >= 1.");
  if (!Number.isInteger(input.exerciseSeconds) || input.exerciseSeconds < 1) throw new Error("Ejercicio debe ser >= 1 segundo.");
  if (!Number.isInteger(input.restSeconds) || input.restSeconds < 0) throw new Error("Descanso debe ser >= 0 segundos.");
  return { ...input, name };
}

import type { TimerConfig } from "../models/TimerConfig";

export function validateTimerConfig(input: TimerConfig) {
  if (!Number.isInteger(input.sets) || input.sets < 1) throw new Error("Sets debe ser un entero >= 1.");
  if (!Number.isInteger(input.exerciseSeconds) || input.exerciseSeconds < 1) {
    throw new Error("Ejercicio debe ser >= 1 segundo.");
  }
  if (!Number.isInteger(input.restSeconds) || input.restSeconds < 0) {
    throw new Error("Descanso debe ser >= 0 segundos.");
  }
  if (typeof input.exerciseAutoAdvance !== "boolean") {
    throw new Error("Auto avance de ejercicio invalido.");
  }
  if (typeof input.restAutoAdvance !== "boolean") {
    throw new Error("Auto avance de descanso invalido.");
  }
  return input;
}

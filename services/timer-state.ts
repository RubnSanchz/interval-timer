import type { TimerConfig } from "@/domain/models/TimerConfig";

export type Phase = "prep" | "exercise" | "rest" | "done";
export type Status = "running" | "paused" | "holding" | "done";
export type PendingTransition = { phase: "exercise" | "rest"; setIndex: number; remaining: number };
export type TimerSnapshot = {
 phase: Phase;
 setIndex: number;
 remaining: number;
 status: Status;
 pending: PendingTransition | null;
};

export function advanceTimerBySeconds(
 snapshot: TimerSnapshot,
 config: TimerConfig,
 elapsedSeconds: number
): TimerSnapshot {
 if (elapsedSeconds <= 0) return snapshot;
 if (snapshot.status !== "running") return snapshot;

 let { phase, setIndex, remaining } = snapshot;
 let status: Status = snapshot.status;
 let pending: PendingTransition | null = snapshot.pending;
 let secondsLeft = elapsedSeconds;

 if (pending) pending = null;
 if (remaining < 0) remaining = 0;

 while (secondsLeft > 0 && status === "running") {
  if (remaining > 0) {
   if (secondsLeft < remaining) {
    remaining -= secondsLeft;
    secondsLeft = 0;
    break;
   }
   secondsLeft -= remaining;
   remaining = 0;
   if (secondsLeft === 0) break;
  }

  if (phase === "prep") {
   phase = "exercise";
   remaining = config.exerciseSeconds;
   continue;
  }

  if (phase === "exercise") {
   if (setIndex >= config.sets) {
    phase = "done";
    status = "done";
    pending = null;
    remaining = 0;
    break;
   }

   const nextPhase =
    config.restSeconds > 0
     ? { phase: "rest" as const, setIndex, remaining: config.restSeconds }
     : { phase: "exercise" as const, setIndex: setIndex + 1, remaining: config.exerciseSeconds };

   if (config.exerciseAutoAdvance) {
    phase = nextPhase.phase;
    setIndex = nextPhase.setIndex;
    remaining = nextPhase.remaining;
    continue;
   }

   pending = nextPhase;
   status = "holding";
   break;
  }

  if (phase === "rest") {
   const nextSet = setIndex + 1;
   if (nextSet > config.sets) {
    phase = "done";
    status = "done";
    pending = null;
    remaining = 0;
    break;
   }

   const nextPhase = { phase: "exercise" as const, setIndex: nextSet, remaining: config.exerciseSeconds };
   if (config.restAutoAdvance) {
    phase = nextPhase.phase;
    setIndex = nextPhase.setIndex;
    remaining = nextPhase.remaining;
    continue;
   }

   pending = nextPhase;
   status = "holding";
   break;
  }

  phase = "done";
  status = "done";
  pending = null;
  remaining = 0;
  break;
 }

 return { phase, setIndex, remaining, status, pending };
}

export function applySkipTransition(snapshot: TimerSnapshot, config: TimerConfig): TimerSnapshot {
 if (snapshot.status === "done") return snapshot;

 if (snapshot.phase === "prep") {
  return {
   phase: "exercise",
   setIndex: 1,
   remaining: config.exerciseSeconds,
   status: "running",
   pending: null,
  };
 }

 if (snapshot.phase === "exercise") {
  if (config.restSeconds > 0) {
   return {
    phase: "rest",
    setIndex: snapshot.setIndex,
    remaining: config.restSeconds,
    status: "running",
    pending: null,
   };
  }

  const nextSet = snapshot.setIndex + 1;
  if (nextSet > config.sets) {
   return {
    phase: "done",
    setIndex: snapshot.setIndex,
    remaining: 0,
    status: "done",
    pending: null,
   };
  }

  return {
   phase: "exercise",
   setIndex: nextSet,
   remaining: config.exerciseSeconds,
   status: "running",
   pending: null,
  };
 }

 const nextSet = snapshot.setIndex + 1;
 if (nextSet > config.sets) {
  return {
   phase: "done",
   setIndex: snapshot.setIndex,
   remaining: 0,
   status: "done",
   pending: null,
  };
 }

 return {
  phase: "exercise",
  setIndex: nextSet,
  remaining: config.exerciseSeconds,
  status: "running",
  pending: null,
 };
}

export function isSameConfig(a: TimerConfig, b: TimerConfig) {
 return (
  a.sets === b.sets &&
  a.exerciseSeconds === b.exerciseSeconds &&
  a.restSeconds === b.restSeconds &&
  a.exerciseAutoAdvance === b.exerciseAutoAdvance &&
  a.restAutoAdvance === b.restAutoAdvance
 );
}

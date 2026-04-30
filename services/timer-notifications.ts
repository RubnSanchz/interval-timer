import type { TimerConfig } from "@/domain/models/TimerConfig";
import {
  advanceTimerBySeconds,
  advanceTimerBySecondsWithBeeps,
  applySkipTransition,
  type BeepEvent,
  type TimerSnapshot,
} from "@/services/timer-state";
import { formatTime } from "@/utils/formatTime";
import notifee, { AndroidImportance, AuthorizationStatus } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { FloatingBubbleHelper } from "tylo-floating-bubble";

export const TIMER_NOTIFICATION_ACTIONS = {
 PAUSE: "timer.pause",
 SKIP: "timer.skip",
};

export type StoredTimerState = {
 config: TimerConfig;
 snapshot: TimerSnapshot;
 updatedAt: number;
};

const STORAGE_KEY = "intervalTimer.timerState.v2";
const SETTINGS_STORAGE_KEY = "intervalTimer.settings.v1";
const APP_STATE_STORAGE_KEY = "intervalTimer.appState";
const PENDING_BEEPS_STORAGE_KEY = "intervalTimer.pendingBeeps";
const FOREGROUND_CHANNEL_ID = "timer-foreground";
const ALERT_CHANNEL_ID_SHORT = "timer-alerts-short-v1";
const ALERT_CHANNEL_ID_LONG = "timer-alerts-long-v1";
const ALERT_SOUND_SHORT = "beep_short";
const ALERT_SOUND_LONG = "beep_long";
const FOREGROUND_NOTIFICATION_ID = "timer-foreground";
const ALERT_NOTIFICATION_ID = "timer-alert";
const ALERT_MIN_GAP_MS = 320;
const WATCHDOG_TICK_TIMEOUT_MS = 3000;
const WATCHDOG_MAX_MISSED_TICKS = 3;
const BREADCRUMB_MAX_SIZE = 50;
const BEEP_TRANSITION_TIMEOUT_MS = 2000; // Max time to wait for reschedule before discarding

type StoredAppSettings = {
 androidFloatingBubbleEnabled?: boolean;
};

type PendingBeepTransition = {
 kind: "short" | "long";
 scheduledAt: number;
};

type BreadcrumbEntry = {
 timestamp: number;
 scope: string;
 message: string;
 level: "info" | "warn" | "error";
};

let breadcrumbs: BreadcrumbEntry[] = [];
let serviceWatchdog: {
 lastHeartbeat: number;
 missedTicks: number;
 isRunning: boolean;
} = {
 lastHeartbeat: 0,
 missedTicks: 0,
 isRunning: false,
};

function addBreadcrumb(scope: string, message: string, level: "info" | "warn" | "error" = "info") {
 const entry: BreadcrumbEntry = {
  timestamp: Date.now(),
  scope,
  message,
  level,
 };
 breadcrumbs.push(entry);
 if (breadcrumbs.length > BREADCRUMB_MAX_SIZE) {
  breadcrumbs.shift();
 }
 const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
 console.log(`${prefix} [timer:${scope}] ${message}`);
}

function logTimerError(scope: string, error: unknown) {
 const message = error instanceof Error ? error.message : String(error);
 addBreadcrumb(scope, message, "error");
}

export function getServiceBreadcrumbs(): BreadcrumbEntry[] {
 return [...breadcrumbs];
}

export async function recordAppState(state: "active" | "background") {
 try {
  await AsyncStorage.setItem(APP_STATE_STORAGE_KEY, state);
  addBreadcrumb("app-state", `App state updated: ${state}`, "info");
 } catch (error) {
  logTimerError("app-state-storage", error);
 }
}

async function isAppInForeground(): Promise<boolean> {
 try {
  const state = await AsyncStorage.getItem(APP_STATE_STORAGE_KEY);
  return state === "active";
 } catch {
  return false;
 }
}

export async function recordBeepDuringTransition(kind: "short" | "long") {
 try {
  const pending: PendingBeepTransition = {
   kind,
   scheduledAt: Date.now(),
  };
  await AsyncStorage.setItem(PENDING_BEEPS_STORAGE_KEY, JSON.stringify(pending));
  addBreadcrumb("beep-transition", `Beep recorded during state change (${kind})`, "warn");
 } catch (error) {
  logTimerError("beep-transition-storage", error);
 }
}

export async function getPendingBeepTransition(): Promise<PendingBeepTransition | null> {
 try {
  const raw = await AsyncStorage.getItem(PENDING_BEEPS_STORAGE_KEY);
  if (!raw) return null;
  const pending = JSON.parse(raw) as PendingBeepTransition;
  const elapsedMs = Date.now() - pending.scheduledAt;

  if (elapsedMs > BEEP_TRANSITION_TIMEOUT_MS) {
   // Beep is too old, discard it
   await AsyncStorage.removeItem(PENDING_BEEPS_STORAGE_KEY);
   addBreadcrumb("beep-transition", `Discarded stale pending beep (${elapsedMs}ms old)`, "info");
   return null;
  }

  return pending;
 } catch {
  return null;
 }
}

export async function clearPendingBeepTransition() {
 try {
  await AsyncStorage.removeItem(PENDING_BEEPS_STORAGE_KEY);
 } catch {}
}

function recordHeartbeat() {
 serviceWatchdog.lastHeartbeat = Date.now();
 serviceWatchdog.missedTicks = 0;
 addBreadcrumb("watchdog", "Service heartbeat recorded", "info");
}

function checkWatchdog(): boolean {
 const now = Date.now();
 const timeSinceHeartbeat = now - serviceWatchdog.lastHeartbeat;

 if (timeSinceHeartbeat > WATCHDOG_TICK_TIMEOUT_MS) {
  serviceWatchdog.missedTicks++;
  addBreadcrumb(
   "watchdog",
   `Missed tick #${serviceWatchdog.missedTicks} (${timeSinceHeartbeat}ms since last heartbeat)`,
   "warn",
  );

  if (serviceWatchdog.missedTicks >= WATCHDOG_MAX_MISSED_TICKS) {
   addBreadcrumb(
    "watchdog",
    `Service STUCK after ${serviceWatchdog.missedTicks} missed ticks! Triggering auto-restart...`,
    "error",
   );
   return false;
  }
 } else {
  serviceWatchdog.missedTicks = Math.max(0, serviceWatchdog.missedTicks - 1);
 }

 return true;
}

function isValidSnapshot(snapshot: unknown): snapshot is TimerSnapshot {
 if (!snapshot || typeof snapshot !== "object") return false;
 const candidate = snapshot as TimerSnapshot;
 return (
  typeof candidate.phase === "string" &&
  typeof candidate.setIndex === "number" &&
  typeof candidate.remaining === "number" &&
  typeof candidate.status === "string" &&
  (candidate.pending === null ||
   (typeof candidate.pending === "object" &&
    typeof candidate.pending.phase === "string" &&
    typeof candidate.pending.setIndex === "number" &&
    typeof candidate.pending.remaining === "number"))
 );
}

function isValidConfig(config: unknown): config is TimerConfig {
 if (!config || typeof config !== "object") return false;
 const candidate = config as TimerConfig;
 return (
  typeof candidate.sets === "number" &&
  typeof candidate.exerciseSeconds === "number" &&
  typeof candidate.restSeconds === "number" &&
  typeof candidate.exerciseAutoAdvance === "boolean" &&
  typeof candidate.restAutoAdvance === "boolean"
 );
}

function parseStoredState(raw: string | null): StoredTimerState | null {
 if (!raw) return null;
 try {
  const parsed = JSON.parse(raw) as StoredTimerState;
  if (!parsed || typeof parsed !== "object") return null;
  if (!isValidConfig(parsed.config)) return null;
  if (!isValidSnapshot(parsed.snapshot)) return null;
  if (typeof parsed.updatedAt !== "number") return null;
  return parsed;
 } catch {
  return null;
 }
}

function getPhaseLabel(phase: TimerSnapshot["phase"]) {
 switch (phase) {
  case "prep":
   return "Preparacion";
  case "exercise":
   return "Ejercicio";
  case "rest":
   return "Descanso";
  case "done":
   return "Completado";
  default:
   return "Intervalo";
 }
}

function getStatusTitle(snapshot: TimerSnapshot) {
 if (snapshot.status === "holding") return "Listo para continuar";
 if (snapshot.status === "paused") return "Temporizador pausado";
 if (snapshot.status === "done") return "Entreno completado";
 return "Intervalo en curso";
}

function buildBubbleSubtitle(snapshot: TimerSnapshot, config: TimerConfig) {
 const phaseLabel = getPhaseLabel(snapshot.phase);
 const setLabel = `${Math.min(snapshot.setIndex, config.sets)}/${config.sets}`;
 return `${phaseLabel} - ${formatTime(snapshot.remaining)} - Set ${setLabel}`;
}

async function isFloatingBubbleEnabled() {
 try {
  const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) return false;
  const parsed = JSON.parse(raw) as StoredAppSettings;
  return parsed?.androidFloatingBubbleEnabled === true;
 } catch {
  return false;
 }
}

async function updateFloatingBubble(snapshot: TimerSnapshot, config: TimerConfig) {
 if (Platform.OS !== "android") return;
 const bubbleEnabled = await isFloatingBubbleEnabled();
 if (!bubbleEnabled) {
  try {
   await FloatingBubbleHelper.hideBubble();
  } catch {}
  return;
 }

 try {
  const granted = await FloatingBubbleHelper.checkPermission();
  if (!granted) {
   await FloatingBubbleHelper.hideBubble();
   return;
  }
 } catch {
  return;
 }

 try {
  await FloatingBubbleHelper.showBubble({
   title: "Timer activo",
   subtitle: buildBubbleSubtitle(snapshot, config),
   showBadge: false,
   autoRequestPermission: false,
  });
 } catch (error) {
  logTimerError("bubble-update", error);
 }
}

function buildStatusBody(snapshot: TimerSnapshot, config: TimerConfig) {
 if (snapshot.status === "holding" && snapshot.pending) {
  const phaseLabel = getPhaseLabel(snapshot.pending.phase);
  const setLabel = `Set ${Math.min(snapshot.pending.setIndex, config.sets)} / ${config.sets}`;
  const timeLabel = `Tiempo restante: ${formatTime(snapshot.pending.remaining)}`;
  return `Siguiente: ${phaseLabel} - ${timeLabel} - ${setLabel}`;
 }
 const phaseLabel = getPhaseLabel(snapshot.phase);
 const setLabel = `Set ${Math.min(snapshot.setIndex, config.sets)} / ${config.sets}`;
 const timeLabel = `Tiempo restante: ${formatTime(snapshot.remaining)}`;
 return `Fase: ${phaseLabel} - ${timeLabel} - ${setLabel}`;
}

async function ensureChannelsConfigured() {
 if (Platform.OS !== "android") return;

 await notifee.createChannel({
  id: FOREGROUND_CHANNEL_ID,
  name: "Temporizador",
  importance: AndroidImportance.LOW,
  vibration: false,
 });

 await notifee.createChannel({
  id: ALERT_CHANNEL_ID_SHORT,
  name: "Alertas del temporizador",
  importance: AndroidImportance.HIGH,
  vibration: true,
  sound: ALERT_SOUND_SHORT,
 });

 await notifee.createChannel({
  id: ALERT_CHANNEL_ID_LONG,
  name: "Alertas del temporizador (final)",
  importance: AndroidImportance.HIGH,
  vibration: true,
  sound: ALERT_SOUND_LONG,
 });
}

async function updateForegroundNotification(snapshot: TimerSnapshot, config: TimerConfig) {
 await notifee.displayNotification({
  id: FOREGROUND_NOTIFICATION_ID,
  title: getStatusTitle(snapshot),
  body: buildStatusBody(snapshot, config),
  android: {
   channelId: FOREGROUND_CHANNEL_ID,
   asForegroundService: true,
   ongoing: true,
   onlyAlertOnce: true,
   pressAction: { id: "default" },
   actions: [
    { title: "Pausar", pressAction: { id: TIMER_NOTIFICATION_ACTIONS.PAUSE } },
    { title: "Saltar", pressAction: { id: TIMER_NOTIFICATION_ACTIONS.SKIP } },
   ],
  },
 });
}

async function showBeepNotification(snapshot: TimerSnapshot, kind: "short" | "long", channelId: string) {
 const phaseLabel = getPhaseLabel(snapshot.phase);
 const timeLabel = snapshot.remaining === 0 ? "00:00" : formatTime(snapshot.remaining);
 const toneLabel = kind === "long" ? "Fin de fase" : "Aviso";

 // Check if app is in foreground - if so, skip audio notification (expo-av will handle it in timer.tsx)
 const inForeground = await isAppInForeground();
 const useAudio = !inForeground; // Only use Notifee audio when app is in background

 const channelIdToUse = useAudio ? channelId : FOREGROUND_CHANNEL_ID; // Use silent channel if in foreground

 await notifee.displayNotification({
  id: ALERT_NOTIFICATION_ID,
  title: toneLabel,
  body: `${phaseLabel} - ${timeLabel}`,
  android: {
   channelId: channelIdToUse,
   pressAction: { id: "default" },
   timeoutAfter: 3500,
   onlyAlertOnce: false,
   showTimestamp: true,
   timestamp: Date.now(),
  },
 });

 if (useAudio) {
  addBreadcrumb("audio-routing", `Beep played via Notifee (background - ${kind})`, "info");
 } else {
  addBreadcrumb("audio-routing", `Beep suppressed from Notifee (foreground - ${kind})`, "info");
 }
}

export async function ensureTimerNotificationsReady() {
 if (Platform.OS !== "android") return false;
 const settings = await notifee.requestPermission();
 await ensureChannelsConfigured();
 return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
}

export async function persistTimerState(state: StoredTimerState) {
 await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function readStoredTimerState(): Promise<StoredTimerState | null> {
 const raw = await AsyncStorage.getItem(STORAGE_KEY);
 return parseStoredState(raw);
}

export async function clearStoredTimerState() {
 await AsyncStorage.removeItem(STORAGE_KEY);
}

export function getCurrentTimerSnapshot(stored: StoredTimerState, now = Date.now()): TimerSnapshot {
 const elapsedMs = now - stored.updatedAt;
 const elapsedSeconds = elapsedMs > 0 ? Math.floor(elapsedMs / 1000) : 0;
 return advanceTimerBySeconds(stored.snapshot, stored.config, elapsedSeconds);
}

export async function startTimerForegroundService(state: StoredTimerState) {
 if (Platform.OS !== "android") return;
 try {
  await persistTimerState(state);
  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) return;
  await ensureChannelsConfigured();
  const snapshot = getCurrentTimerSnapshot(state, Date.now());
  await updateForegroundNotification(snapshot, state.config);
  await updateFloatingBubble(snapshot, state.config);
 } catch (error) {
  logTimerError("start-service", error);
 }
}

export async function stopTimerForegroundService() {
 if (Platform.OS !== "android") return;
 try {
  await notifee.stopForegroundService();
 } catch (error) {
  logTimerError("stop-service", error);
 }
 try {
  await notifee.cancelNotification(FOREGROUND_NOTIFICATION_ID);
 } catch (error) {
  logTimerError("cancel-foreground-notification", error);
 }
 try {
  await notifee.cancelNotification(ALERT_NOTIFICATION_ID);
 } catch (error) {
  logTimerError("cancel-alert-notification", error);
 }
 try {
  await FloatingBubbleHelper.hideBubble();
 } catch {}
}

export async function handleTimerNotificationAction(actionId: string) {
 if (Platform.OS !== "android") return;
 if (actionId !== TIMER_NOTIFICATION_ACTIONS.PAUSE && actionId !== TIMER_NOTIFICATION_ACTIONS.SKIP) return;

 const stored = await readStoredTimerState();
 if (!stored) return;

 const now = Date.now();
 const current = getCurrentTimerSnapshot(stored, now);
 let next = current;

 if (actionId === TIMER_NOTIFICATION_ACTIONS.PAUSE) {
  if (current.status === "running" || current.status === "holding") {
   next = { ...current, status: "paused" };
  }
 }

 if (actionId === TIMER_NOTIFICATION_ACTIONS.SKIP) {
  next = applySkipTransition(current, stored.config);
 }

 await persistTimerState({ config: stored.config, snapshot: next, updatedAt: now });

 if (next.status === "paused" || next.status === "done") {
  await stopTimerForegroundService();
  return;
 }

 await updateForegroundNotification(next, stored.config);
}

export function registerTimerForegroundService() {
 if (Platform.OS !== "android") return;

 notifee.registerForegroundService(async () => {
  await ensureChannelsConfigured();
  addBreadcrumb("foreground-service", "Service registered, starting loop...", "info");
  serviceWatchdog.isRunning = true;
  recordHeartbeat();

  return new Promise<void>((resolve) => {
   let lastAlertAt = 0;
   let lastAlertChannelId: string | null = null;
   let stopped = false;
   let inFlight = false;
   let tickCount = 0;
   let watchdogInterval: ReturnType<typeof setInterval> | null = null;
   let pendingTickTimeout: ReturnType<typeof setTimeout> | null = null;

   const stopForegroundLoop = async () => {
    stopped = true;
    if (pendingTickTimeout) clearTimeout(pendingTickTimeout);
    if (watchdogInterval) clearInterval(watchdogInterval);
    await stopTimerForegroundService();
    serviceWatchdog.isRunning = false;
   };

   const scheduleNextTick = () => {
    if (stopped) return;

    pendingTickTimeout = setTimeout(async () => {
     if (stopped || inFlight) {
      scheduleNextTick();
      return;
     }
     inFlight = true;
     tickCount++;

     try {
      const stored = await readStoredTimerState();
      if (!stored) {
       addBreadcrumb("foreground-service-loop", "No stored state, stopping service", "warn");
       await stopForegroundLoop();
       resolve();
       return;
      }

      const now = Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((now - stored.updatedAt) / 1000));
      let snapshot = stored.snapshot;
      let beepEvents: BeepEvent[] = [];

      if (elapsedSeconds > 0) {
       const result = advanceTimerBySecondsWithBeeps(stored.snapshot, stored.config, elapsedSeconds);
       snapshot = result.snapshot;
       beepEvents = result.beeps;
      }

      const consumedAt = stored.updatedAt + elapsedSeconds * 1000;
      await persistTimerState({
       config: stored.config,
       snapshot,
       updatedAt: consumedAt,
      });

      if (beepEvents.length > 0) {
       const tickStartedAt = now;
       let lastOffset: number | null = null;
       for (const event of beepEvents) {
        const nowTime = Date.now();
        const secondsBehind = Math.max(0, elapsedSeconds - event.offsetSeconds);
        const desiredAt = tickStartedAt - secondsBehind * 1000;
        const offsetGapMs =
         lastOffset === null ? 0 : Math.max((event.offsetSeconds - lastOffset) * 1000, ALERT_MIN_GAP_MS);
        const scheduledAt = Math.max(desiredAt, nowTime, lastAlertAt + offsetGapMs);
        const delayMs = scheduledAt - nowTime;
        lastAlertAt = scheduledAt;
        lastOffset = event.offsetSeconds;
        if (delayMs > 0) {
         await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
        }
        const channelId = event.kind === "long" ? ALERT_CHANNEL_ID_LONG : ALERT_CHANNEL_ID_SHORT;
        if (channelId !== lastAlertChannelId) {
         try {
          await notifee.cancelNotification(ALERT_NOTIFICATION_ID);
         } catch {}
         lastAlertChannelId = channelId;
        }
        await showBeepNotification(event.snapshot, event.kind, channelId);
       }
      }

      if (snapshot.status === "paused" || snapshot.status === "done") {
       addBreadcrumb("foreground-service-loop", `Timer finished (status: ${snapshot.status})`, "info");
       await stopForegroundLoop();
       resolve();
       return;
      }

      await updateForegroundNotification(snapshot, stored.config);
      await updateFloatingBubble(snapshot, stored.config);
      recordHeartbeat();
      addBreadcrumb(
       "foreground-service-loop",
       `Tick #${tickCount} completed (elapsed: ${elapsedSeconds}s, phase: ${snapshot.phase})`,
       "info",
      );
     } catch (error) {
      logTimerError("foreground-service-loop", error);
     } finally {
      inFlight = false;
      scheduleNextTick();
     }
    }, 1000);
   };

   scheduleNextTick();

   // Watchdog timer: check if main loop is stuck
   watchdogInterval = setInterval(async () => {
    if (stopped) return;

    const isHealthy = checkWatchdog();
    if (!isHealthy) {
     addBreadcrumb("watchdog", "Attempting service recovery...", "warn");
     await stopForegroundLoop();

     try {
      const stored = await readStoredTimerState();
      if (stored) {
       addBreadcrumb("watchdog", `Service restarted (recovered state: ${stored.snapshot.phase})`, "info");
       await startTimerForegroundService(stored);
       resolve();
       return;
      } else {
       addBreadcrumb("watchdog", "State recovery failed, stopping service", "error");
       serviceWatchdog.isRunning = false;
       resolve();
      }
     } catch (recoveryError) {
      logTimerError("watchdog-recovery", recoveryError);
      serviceWatchdog.isRunning = false;
      resolve();
     }
    }
   }, WATCHDOG_TICK_TIMEOUT_MS);
  });
 });
}

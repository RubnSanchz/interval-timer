import type { TimerConfig } from "@/domain/models/TimerConfig";
import { formatTime } from "@/utils/formatTime";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type Phase = "prep" | "exercise" | "rest" | "done";
type Status = "running" | "paused" | "holding" | "done";

export type TimerNotificationState = {
 phase: Phase;
 setIndex: number;
 remaining: number;
 status: Status;
 pending: { phase: "exercise" | "rest"; setIndex: number; remaining: number } | null;
};

export const TIMER_NOTIFICATION_ACTIONS = {
 PAUSE: "timer.pause",
 SKIP: "timer.skip",
};

const TIMER_NOTIFICATION_SOURCE = "interval-timer";
const TIMER_CATEGORY_ID = "timer-actions";
const TIMER_STATUS_CHANNEL_ID = "timer-status";
const TIMER_ALERT_CHANNEL_ID = "timer-alerts";

type ScheduleResult = {
 scheduledIds: string[];
 statusNotificationId: string | null;
};

type ScheduleEvent = {
 offsetSeconds: number;
 phase: Phase;
 remaining: number;
 setIndex: number;
 kind: "phase" | "hold" | "done";
};

function getPhaseLabel(phase: Phase) {
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

function buildStatusBody(state: TimerNotificationState, config: TimerConfig) {
 const phaseLabel = getPhaseLabel(state.phase);
 const setLabel = `Set ${Math.min(state.setIndex, config.sets)} / ${config.sets}`;
 const timeLabel = `Tiempo restante: ${formatTime(state.remaining)}`;
 return `Fase: ${phaseLabel} - ${timeLabel} - ${setLabel}`;
}

function buildPhaseEvents(state: TimerNotificationState, config: TimerConfig) {
 if (state.status !== "running") return [] as ScheduleEvent[];

 const events: ScheduleEvent[] = [];
 let offsetSeconds = 0;
 let phase: Phase = state.phase;
 let setIndex = state.setIndex;
 let remaining = Math.max(0, state.remaining);

 while (true) {
  if (remaining <= 0 && phase === "done") break;
  const phaseEndOffset = offsetSeconds + remaining;

  if (phase === "prep") {
   offsetSeconds = phaseEndOffset;
   phase = "exercise";
   remaining = config.exerciseSeconds;
   events.push({ offsetSeconds, phase, remaining, setIndex, kind: "phase" });
   continue;
  }

  if (phase === "exercise") {
   if (setIndex >= config.sets) {
    offsetSeconds = phaseEndOffset;
    events.push({ offsetSeconds, phase: "done", remaining: 0, setIndex, kind: "done" });
    break;
   }

   if (config.restSeconds > 0) {
    offsetSeconds = phaseEndOffset;
    if (config.exerciseAutoAdvance) {
     phase = "rest";
     remaining = config.restSeconds;
     events.push({ offsetSeconds, phase, remaining, setIndex, kind: "phase" });
     continue;
    }

    events.push({
     offsetSeconds,
     phase: "rest",
     remaining: config.restSeconds,
     setIndex,
     kind: "hold",
    });
    break;
   }

   offsetSeconds = phaseEndOffset;
   if (config.exerciseAutoAdvance) {
    const nextSet = setIndex + 1;
    if (nextSet > config.sets) {
     events.push({ offsetSeconds, phase: "done", remaining: 0, setIndex, kind: "done" });
     break;
    }
    setIndex = nextSet;
    phase = "exercise";
    remaining = config.exerciseSeconds;
    events.push({ offsetSeconds, phase, remaining, setIndex, kind: "phase" });
    continue;
   }

   events.push({
    offsetSeconds,
    phase: "exercise",
    remaining: config.exerciseSeconds,
    setIndex: setIndex + 1,
    kind: "hold",
   });
   break;
  }

  if (phase === "rest") {
   const nextSet = setIndex + 1;
   offsetSeconds = phaseEndOffset;
   if (nextSet > config.sets) {
    events.push({ offsetSeconds, phase: "done", remaining: 0, setIndex, kind: "done" });
    break;
   }

   if (config.restAutoAdvance) {
    setIndex = nextSet;
    phase = "exercise";
    remaining = config.exerciseSeconds;
    events.push({ offsetSeconds, phase, remaining, setIndex, kind: "phase" });
    continue;
   }

   events.push({
    offsetSeconds,
    phase: "exercise",
    remaining: config.exerciseSeconds,
    setIndex: nextSet,
    kind: "hold",
   });
   break;
  }

  events.push({ offsetSeconds: phaseEndOffset, phase: "done", remaining: 0, setIndex, kind: "done" });
  break;
 }

 return events.filter((event) => event.offsetSeconds > 0);
}

function buildAlertContent(event: ScheduleEvent, config: TimerConfig): Notifications.NotificationContentInput {
 const phaseLabel = getPhaseLabel(event.phase);
 const setLabel = `Set ${Math.min(event.setIndex, config.sets)} / ${config.sets}`;
 const timeLabel = event.kind === "done" ? "Tiempo restante: 00:00" : `Tiempo restante: ${formatTime(event.remaining)}`;

 let title = "Intervalo en curso";
 if (event.kind === "done") title = "Entreno completado";
 if (event.kind === "hold") title = "Listo para continuar";

 const body =
  event.kind === "hold"
   ? `Siguiente: ${phaseLabel} - ${timeLabel} - ${setLabel}`
   : `Fase: ${phaseLabel} - ${timeLabel} - ${setLabel}`;

 return {
  title,
  body,
  sound: "default",
  categoryIdentifier: TIMER_CATEGORY_ID,
  channelId: TIMER_ALERT_CHANNEL_ID,
  data: { source: TIMER_NOTIFICATION_SOURCE },
 };
}

function buildStatusContent(
 state: TimerNotificationState,
 config: TimerConfig
): Notifications.NotificationContentInput {
 return {
  title: "Intervalo en curso",
  body: buildStatusBody(state, config),
  categoryIdentifier: TIMER_CATEGORY_ID,
  channelId: TIMER_STATUS_CHANNEL_ID,
  data: { source: TIMER_NOTIFICATION_SOURCE },
 };
}

async function ensureChannelsConfigured() {
 if (Platform.OS !== "android") return;

 await Notifications.setNotificationChannelAsync(TIMER_STATUS_CHANNEL_ID, {
  name: "Temporizador",
  importance: Notifications.AndroidImportance.LOW,
  sound: null,
  vibrationPattern: [],
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
 });

 await Notifications.setNotificationChannelAsync(TIMER_ALERT_CHANNEL_ID, {
  name: "Alertas del temporizador",
  importance: Notifications.AndroidImportance.HIGH,
  sound: "default",
  vibrationPattern: [0, 200, 200, 200],
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
 });
}

async function ensureCategoryConfigured() {
 await Notifications.setNotificationCategoryAsync(TIMER_CATEGORY_ID, [
  {
   identifier: TIMER_NOTIFICATION_ACTIONS.PAUSE,
   buttonTitle: "Pausar",
   options: { opensAppToForeground: true },
  },
  {
   identifier: TIMER_NOTIFICATION_ACTIONS.SKIP,
   buttonTitle: "Saltar",
   options: { opensAppToForeground: true },
  },
 ]);
}

export async function prepareTimerNotifications() {
 if (Platform.OS === "web") return false;

 const settings = await Notifications.getPermissionsAsync();
 if (settings.status !== "granted") {
  const requested = await Notifications.requestPermissionsAsync();
  if (requested.status !== "granted") return false;
 }

 await ensureChannelsConfigured();
 await ensureCategoryConfigured();
 return true;
}

export async function scheduleTimerNotifications({
 config,
 snapshot,
}: {
 config: TimerConfig;
 snapshot: TimerNotificationState;
}): Promise<ScheduleResult> {
 if (Platform.OS === "web") return { scheduledIds: [], statusNotificationId: null };
 if (snapshot.status !== "running") return { scheduledIds: [], statusNotificationId: null };

 const statusNotificationId = await Notifications.scheduleNotificationAsync({
  content: buildStatusContent(snapshot, config),
  trigger: null,
 });

 const events = buildPhaseEvents(snapshot, config);
 const scheduledIds: string[] = [];
 for (const event of events) {
  const id = await Notifications.scheduleNotificationAsync({
   content: buildAlertContent(event, config),
   trigger: { seconds: event.offsetSeconds },
  });
  scheduledIds.push(id);
 }

 return { scheduledIds, statusNotificationId };
}

export async function clearTimerNotifications(ids: string[], statusNotificationId: string | null) {
 if (Platform.OS === "web") return;
 const allIds = statusNotificationId ? [statusNotificationId, ...ids] : [...ids];
 await Promise.all(
  allIds.map(async (id) => {
   try {
    await Notifications.cancelScheduledNotificationAsync(id);
   } catch {
   }
   try {
    await Notifications.dismissNotificationAsync(id);
   } catch {
   }
  })
 );
}

export function isTimerNotificationResponse(response: Notifications.NotificationResponse) {
 const source = response.notification.request.content.data?.source;
 return source === TIMER_NOTIFICATION_SOURCE;
}

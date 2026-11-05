import notifee, { EventType } from "@notifee/react-native";
import "expo-router/entry";

import { handleTimerNotificationAction, registerTimerForegroundService } from "./services/timer-notifications";

registerTimerForegroundService();

notifee.onBackgroundEvent(async ({ type, detail }) => {
 if (type !== EventType.ACTION_PRESS) return;
 const actionId = detail.pressAction?.id;
 if (!actionId) return;
 await handleTimerNotificationAction(actionId);
});

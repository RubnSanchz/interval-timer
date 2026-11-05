const { withAndroidManifest } = require("@expo/config-plugins");

const NOTIFEE_FOREGROUND_SERVICE = "app.notifee.core.ForegroundService";
const FOREGROUND_SERVICE_TYPE = "mediaPlayback";

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function applyForegroundServiceType(androidManifest) {
  const application = androidManifest.manifest.application?.[0];
  if (!application) return androidManifest;

  const services = asArray(application.service);
  let service = services.find((item) => item?.$?.["android:name"] === NOTIFEE_FOREGROUND_SERVICE);

  if (!service) {
    service = { $: { "android:name": NOTIFEE_FOREGROUND_SERVICE } };
    services.push(service);
  }

  service.$ = service.$ || {};
  service.$["android:exported"] = "false";
  service.$["android:foregroundServiceType"] = FOREGROUND_SERVICE_TYPE;
  application.service = services;

  return androidManifest;
}

module.exports = function withNotifeeForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = applyForegroundServiceType(config.modResults);
    return config;
  });
};

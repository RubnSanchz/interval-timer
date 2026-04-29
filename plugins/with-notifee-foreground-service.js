const fs = require("fs");
const path = require("path");
const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");

const NOTIFEE_FOREGROUND_SERVICE = "app.notifee.core.ForegroundService";
const FOREGROUND_SERVICE_TYPE = "mediaPlayback";
const SOUND_ASSETS = [
  { source: "assets/sounds/beep-short.wav", target: "beep_short.wav" },
  { source: "assets/sounds/beep-long.wav", target: "beep_long.wav" },
];

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

function copySoundAssets(projectRoot, androidProjectRoot) {
  const resRawDir = path.join(androidProjectRoot, "app", "src", "main", "res", "raw");
  fs.mkdirSync(resRawDir, { recursive: true });

  SOUND_ASSETS.forEach(({ source, target }) => {
    const sourcePath = path.join(projectRoot, source);
    if (!fs.existsSync(sourcePath)) return;
    const targetPath = path.join(resRawDir, target);
    fs.copyFileSync(sourcePath, targetPath);
  });
}

module.exports = function withNotifeeForegroundService(config) {
  let nextConfig = withAndroidManifest(config, (config) => {
    config.modResults = applyForegroundServiceType(config.modResults);
    return config;
  });
  nextConfig = withDangerousMod(nextConfig, [
    "android",
    (config) => {
      copySoundAssets(config.modRequest.projectRoot, config.modRequest.platformProjectRoot);
      return config;
    },
  ]);
  return nextConfig;
};

const { app } = require("electron");

/**
 * Applies performance and resource-usage optimizations to the Electron process.
 * These settings are designed to keep the background footprint of VRSleep minimal.
 */
function applyLowRamSettings() {
  // Limit the V8 heap size to prevent the app from consuming excessive memory over time.
  // Default is 128MB, which is plenty for this utility.
  const maxOldSpace = Number(process.env.SLEEPCHAT_MAX_OLD_SPACE_MB || 128);
  if (Number.isFinite(maxOldSpace) && maxOldSpace > 0) {
    app.commandLine.appendSwitch(
      "js-flags",
      `--max-old-space-size=${maxOldSpace}`,
    );
  }

  // Disable Hardware Acceleration to free up GPU resources for VR/Games.
  app.disableHardwareAcceleration();

  // Additional Chromium flags to further reduce background resource usage.
  app.commandLine.appendSwitch("disable-gpu-compositing");

  // Fixes an issue where Electron apps might consume more CPU when the window is hidden/occluded.
  app.commandLine.appendSwitch(
    "disable-features",
    "CalculateNativeWinOcclusion",
  );
}

module.exports = {
  applyLowRamSettings,
};

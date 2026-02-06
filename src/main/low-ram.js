const { app } = require('electron');

function applyLowRamSettings() {
  const maxOldSpace = Number(process.env.SLEEPCHAT_MAX_OLD_SPACE_MB || 128);
  if (Number.isFinite(maxOldSpace) && maxOldSpace > 0) {
    app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${maxOldSpace}`);
  }

  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
}

module.exports = {
  applyLowRamSettings
};

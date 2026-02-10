const { app, BrowserWindow } = require("electron");

try {
  require("electron-reloader")(module);
} catch (_) {}

const { getWhitelist, setWhitelist } = require("../stores/whitelist-store");
const { getSettings, setSettings } = require("../stores/settings-store");
const {
  fetchInvites,
  sendInvite,
  deleteNotification,
  getFriends,
  getCurrentUser,
  updateStatus,
  getMessageSlots,
} = require("../api/vrcapi");
const {
  login,
  verifyTwoFactor,
  logout,
  getAuthStatus,
  isReadyForApi,
} = require("../api/vrcauth");
const { applyLowRamSettings } = require("./low-ram");
const updater = require("./updater");
const { createMainWindow } = require("./window");
const { createSleepMode } = require("./sleep-mode");
const { registerIpcHandlers } = require("./ipc");

let mainWindow;
let updaterInstance = null;
let sleepModeInstance = null;
let isQuitting = false;

const DEFAULT_POLL_MS = 15000;
const MIN_POLL_MS = 10000;

function log(message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("log", message);
  }
}

function notifySettingsChanged(settings) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("settings-changed", settings);
  }
}

applyLowRamSettings();

app.whenReady().then(() => {
  app.setAppUserModelId("com.sleepchat.app");

  mainWindow = createMainWindow(() => updater.checkForUpdates());
  updaterInstance = updater.setupAutoUpdater(() => mainWindow, log);
  updater.checkForUpdates();

  sleepModeInstance = createSleepMode({
    getWhitelist,
    fetchInvites,
    sendInvite,
    deleteNotification,
    isReadyForApi,
    getCurrentUser,
    updateStatus,
    getMessageSlots,
    getSettings,
    setSettings: (settings) => {
      const next = setSettings(settings);
      notifySettingsChanged(next);
      return next;
    },
    log,
    pollIntervalMs: process.env.SLEEPCHAT_POLL_MS || DEFAULT_POLL_MS,
    minPollMs: MIN_POLL_MS,
  });

  registerIpcHandlers({
    getWhitelist,
    setWhitelist,
    getSettings,
    setSettings: (settings) => {
      const next = setSettings(settings);
      if (sleepModeInstance) {
        sleepModeInstance.refreshStatus();
      }
      notifySettingsChanged(next);
      return next;
    },
    sleepMode: sleepModeInstance,
    auth: {
      login,
      verify: verifyTwoFactor,
      logout,
      getStatus: getAuthStatus,
    },
    updater: updaterInstance,
    getFriends,
    getCurrentUser,
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow(() => updater.checkForUpdates());
    }
  });
});

app.on("before-quit", async (event) => {
  if (isQuitting) return;
  if (sleepModeInstance && sleepModeInstance.status().sleepMode) {
    event.preventDefault();
    isQuitting = true;
    try {
      await sleepModeInstance.stop();
    } catch (error) {
      // Ignore error during quit
    }
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

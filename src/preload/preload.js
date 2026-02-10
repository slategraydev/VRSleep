const { contextBridge, ipcRenderer } = require("electron");

/**
 * Preload Script.
 * Securely bridges the renderer process (UI) with the main process.
 * Only explicit, safe functions are exposed via contextBridge to ensure
 * the renderer cannot access Node.js or Electron internals directly.
 */

contextBridge.exposeInMainWorld("sleepchat", {
  // Whitelist Management
  getWhitelist: () => ipcRenderer.invoke("whitelist:get"),
  setWhitelist: (list) => ipcRenderer.invoke("whitelist:set", list),

  // Application Settings
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (settings) => ipcRenderer.invoke("settings:set", settings),

  // Sleep Mode Engine Controls
  startSleep: () => ipcRenderer.invoke("sleep:start"),
  stopSleep: () => ipcRenderer.invoke("sleep:stop"),
  getStatus: () => ipcRenderer.invoke("sleep:status"),

  // Authentication Flow
  getAuthStatus: () => ipcRenderer.invoke("auth:status"),
  getCurrentUser: () => ipcRenderer.invoke("auth:user"),
  login: (username, password) =>
    ipcRenderer.invoke("auth:login", { username, password }),
  verifyTwoFactor: (type, code) =>
    ipcRenderer.invoke("auth:verify", { type, code }),
  logout: () => ipcRenderer.invoke("auth:logout"),

  // VRChat Message Slots (Customization)
  getCachedMessageSlots: () => ipcRenderer.invoke("messages:get-cached"),
  getMessageSlot: (type, slot) =>
    ipcRenderer.invoke("messages:get-slot", { type, slot }),
  getMessageSlots: (type) => ipcRenderer.invoke("messages:get-all", type),
  updateMessageSlot: (type, slot, message) =>
    ipcRenderer.invoke("messages:update-slot", { type, slot, message }),

  // Cooldown Tracking
  getCooldowns: () => ipcRenderer.invoke("messages:get-cooldowns"),
  setCooldown: (type, slot, unlockTimestamp) =>
    ipcRenderer.invoke("messages:set-cooldown", {
      type,
      slot,
      unlockTimestamp,
    }),

  // Utilities & External Data
  getFriends: () => ipcRenderer.invoke("friends:get"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),

  /**
   * Event Listeners: Inbound communication from the main process.
   */
  onLog: (handler) => {
    ipcRenderer.removeAllListeners("log");
    ipcRenderer.on("log", (_event, message) => handler(message));
  },
  onUpdateAvailable: (handler) => {
    ipcRenderer.removeAllListeners("update-available");
    ipcRenderer.on("update-available", () => handler());
  },
});

const { app } = require("electron");
const fs = require("fs");
const path = require("path");

/**
 * Settings Storage Module.
 * Manages the persistent storage of user preferences and application configuration.
 */

const FILE_NAME = "settings.json";

// Default configuration for fresh installations.
const DEFAULT_SETTINGS = {
  sleepStatus: "none",
  sleepStatusDescription: "",
  inviteMessageSlot: 0,
  inviteMessageType: "message",
  autoStatusEnabled: false,
  inviteMessageEnabled: false,
  activeTab: "whitelist", // Track the user's last active tab for UX continuity.
};

/**
 * Returns the absolute path to the settings data file.
 */
function getFilePath() {
  const folder = app.getPath("userData");
  return path.join(folder, FILE_NAME);
}

/**
 * Retrieves the current settings from disk, merged with defaults.
 * @returns {Object} The complete settings object.
 */
function getSettings() {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) return { ...DEFAULT_SETTINGS };

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    // Merge with defaults to ensure new settings (from app updates) are always present.
    return { ...DEFAULT_SETTINGS, ...data };
  } catch (error) {
    // Return defaults if parsing fails to avoid breaking the application.
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Partially or fully updates the application settings.
 * @param {Object} settings - An object containing the settings to update.
 * @returns {Object} The newly saved, complete settings object.
 */
function setSettings(settings) {
  const filePath = getFilePath();
  const current = getSettings();
  const next = { ...current, ...settings };

  try {
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }

  return next;
}

module.exports = {
  getSettings,
  setSettings,
};

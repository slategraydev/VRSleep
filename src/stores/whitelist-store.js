const { app } = require("electron");
const fs = require("fs");
const path = require("path");

/**
 * Whitelist Storage Module.
 * Manages the persistent storage of user IDs and display names that are
 * permitted to trigger automatic invites during Sleep Mode.
 */

const FILE_NAME = "whitelist.json";

/**
 * Returns the absolute path to the whitelist data file.
 */
function getFilePath() {
  const folder = app.getPath("userData");
  return path.join(folder, FILE_NAME);
}

/**
 * Retrieves the current whitelist from disk.
 * @returns {string[]} An array of whitelisted user identifiers.
 */
function getWhitelist() {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) return [];

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // Return an empty list if parsing fails to avoid breaking the application.
    return [];
  }
}

/**
 * Overwrites the entire whitelist on disk.
 * @param {string[]} list - The new array of user identifiers to whitelist.
 * @returns {string[]} The newly saved whitelist.
 */
function setWhitelist(list) {
  const filePath = getFilePath();
  const safeList = Array.isArray(list) ? list : [];

  try {
    fs.writeFileSync(filePath, JSON.stringify(safeList, null, 2));
  } catch (error) {
    console.error("Failed to save whitelist:", error);
  }

  return safeList;
}

module.exports = {
  getWhitelist,
  setWhitelist,
};

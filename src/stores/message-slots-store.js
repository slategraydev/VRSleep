const { app } = require("electron");
const fs = require("fs");
const path = require("path");

/**
 * Message Slots & Cooldown Storage Module.
 * Manages the persistent storage of VRChat message templates and their
 * respective API-enforced update cooldowns.
 */

const FILE_NAME = "message-slots.json";

// Default state: 12 empty slots for each VRChat message type.
const DEFAULT_SLOTS = {
  message: Array(12).fill(""),
  response: Array(12).fill(""),
  request: Array(12).fill(""),
  requestResponse: Array(12).fill(""),
};

// Default cooldowns: Empty objects mapping slot indices to unlock timestamps.
const DEFAULT_COOLDOWNS = {
  message: {},
  response: {},
  request: {},
  requestResponse: {},
};

/**
 * Returns the absolute path to the message slots data file.
 */
function getFilePath() {
  const folder = app.getPath("userData");
  return path.join(folder, FILE_NAME);
}

/**
 * Internal helper to read the data file and return a normalized object.
 */
function getData() {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) {
    return { slots: DEFAULT_SLOTS, cooldowns: DEFAULT_COOLDOWNS };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return {
      slots: data.slots || DEFAULT_SLOTS,
      cooldowns: data.cooldowns || DEFAULT_COOLDOWNS,
    };
  } catch (error) {
    // If the file is corrupted, return the defaults to prevent application crash.
    return { slots: DEFAULT_SLOTS, cooldowns: DEFAULT_COOLDOWNS };
  }
}

/**
 * Internal helper to write the data object to the persistent store.
 */
function saveData(data) {
  const filePath = getFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to save message slots data:", error);
  }
}

/**
 * Retrieves all cached message slots.
 */
function getCachedSlots() {
  return getData().slots;
}

/**
 * Overwrites the entire message slot cache.
 * @param {Object} slots - An object containing all message types and their slots.
 */
function saveCachedSlots(slots) {
  const data = getData();
  data.slots = slots;
  saveData(data);
}

/**
 * Updates a single message slot in the cache.
 * @param {string} type - The message type (e.g., 'message', 'response').
 * @param {number} slotIndex - The index of the slot (0-11).
 * @param {string} message - The new message content.
 * @returns {Object} The updated slots object.
 */
function updateCachedSlot(type, slotIndex, message) {
  const data = getData();
  if (!data.slots[type]) data.slots[type] = Array(12).fill("");
  data.slots[type][slotIndex] = message;
  saveData(data);
  return data.slots;
}

/**
 * Retrieves all slot cooldown unlock timestamps.
 */
function getSlotCooldowns() {
  return getData().cooldowns;
}

/**
 * Updates the unlock timestamp for a specific slot cooldown.
 * @param {string} type - The message type.
 * @param {number} slotIndex - The index of the slot.
 * @param {number} unlockTime - The Unix timestamp (ms) when the slot becomes updateable.
 */
function updateSlotCooldown(type, slotIndex, unlockTime) {
  const data = getData();
  if (!data.cooldowns[type]) data.cooldowns[type] = {};
  data.cooldowns[type][slotIndex] = unlockTime;
  saveData(data);
}

module.exports = {
  getCachedSlots,
  saveCachedSlots,
  updateCachedSlot,
  getSlotCooldowns,
  updateSlotCooldown,
};

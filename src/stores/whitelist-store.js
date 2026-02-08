const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const FILE_NAME = 'whitelist.json';

function getFilePath() {
  const folder = app.getPath('userData');
  return path.join(folder, FILE_NAME);
}

function getWhitelist() {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function setWhitelist(list) {
  const filePath = getFilePath();
  const safeList = Array.isArray(list) ? list : [];
  fs.writeFileSync(filePath, JSON.stringify(safeList, null, 2));
  return safeList;
}

module.exports = {
  getWhitelist,
  setWhitelist
};

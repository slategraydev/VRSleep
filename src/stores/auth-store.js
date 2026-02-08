const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

const FILE_NAME = 'auth.json';
let cachedAuth = null;

function getFilePath() {
  return path.join(app.getPath('userData'), FILE_NAME);
}

function loadAuth() {
  if (cachedAuth) return cachedAuth;
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const payload = JSON.parse(raw);
    if (!payload?.data) return null;
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available on this system.');
    }
    const decrypted = safeStorage.decryptString(Buffer.from(payload.data, 'base64'));
    cachedAuth = JSON.parse(decrypted);
    return cachedAuth;
  } catch {
    return null;
  }
}

function saveAuth(auth) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system.');
  }
  const filePath = getFilePath();
  const payload = Buffer.from(JSON.stringify(auth), 'utf8');
  const encrypted = safeStorage.encryptString(payload.toString('utf8'));
  fs.writeFileSync(filePath, JSON.stringify({ data: encrypted.toString('base64') }));
  cachedAuth = auth;
}

function clearAuth() {
  cachedAuth = null;
  const filePath = getFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  loadAuth,
  saveAuth,
  clearAuth
};

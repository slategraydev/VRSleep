const API_BASE = 'https://api.vrchat.cloud/api/1';
const { getAuthHeaders } = require('./vrcauth');

function buildUrl(path) {
  const apiKey = process.env.VRC_API_KEY;
  if (!apiKey) return `${API_BASE}${path}`;
  const joiner = path.includes('?') ? '&' : '?';
  return `${API_BASE}${path}${joiner}apiKey=${encodeURIComponent(apiKey)}`;
}

function getHeaders() {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  return headers;
}

async function fetchInvites() {
  const url = buildUrl('/notifications?type=invite&n=50');
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`Invite fetch failed (${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    id: item.id || item._id,
    senderId: item.senderUserId || item.senderId || item.userId,
    senderDisplayName: item.senderDisplayName || item.senderUsername || item.displayName
  }));
}

async function sendInvite(userId) {
  if (!userId) throw new Error('Missing user id');
  const url = buildUrl(`/invite/${encodeURIComponent(userId)}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      instanceId: 'offline'
    })
  });

  if (!response.ok) {
    throw new Error(`Invite send failed (${response.status})`);
  }

  return response.json();
}

module.exports = {
  fetchInvites,
  sendInvite
};

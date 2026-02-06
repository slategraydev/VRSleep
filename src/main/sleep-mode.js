function createSleepMode({
  getWhitelist,
  fetchInvites,
  sendInvite,
  isReadyForApi,
  log,
  pollIntervalMs,
  minPollMs
}) {
  let sleepMode = false;
  let pollTimer = null;
  const handledInviteIds = new Set();

  function getPollInterval() {
    const raw = Number(pollIntervalMs);
    if (!Number.isFinite(raw)) return minPollMs;
    return Math.max(raw, minPollMs);
  }

  function normalizeEntry(entry) {
    return String(entry || '').trim().toLowerCase();
  }

  async function checkInvites() {
    if (!sleepMode) return;
    if (!isReadyForApi()) {
      log('API not ready: login required.');
      return;
    }

    let invites;
    try {
      invites = await fetchInvites();
    } catch (error) {
      log(`Failed to fetch invites: ${error.message}`);
      return;
    }

    if (!Array.isArray(invites) || invites.length === 0) return;

    const whitelist = getWhitelist().map(normalizeEntry).filter(Boolean);
    for (const invite of invites) {
      if (!invite) continue;
      const inviteId = invite.id || invite.notificationId || invite._id;
      if (inviteId && handledInviteIds.has(inviteId)) continue;

      const senderId = normalizeEntry(invite.senderId || invite.senderUserId || invite.userId);
      const senderName = normalizeEntry(invite.senderDisplayName || invite.senderUsername || invite.displayName);

      const matches = whitelist.includes(senderId) || whitelist.includes(senderName);
      if (!matches) continue;

      try {
        await sendInvite(senderId);
        if (inviteId) handledInviteIds.add(inviteId);
        log(`Sent invite to ${invite.senderDisplayName || invite.senderUsername || senderId}.`);
      } catch (error) {
        log(`Failed to send invite: ${error.message}`);
      }
    }
  }

  function startPolling() {
    if (pollTimer) return;
    const interval = getPollInterval();
    pollTimer = setInterval(checkInvites, interval);
    checkInvites();
  }

  function stopPolling() {
    if (!pollTimer) return;
    clearInterval(pollTimer);
    pollTimer = null;
  }

  function start() {
    sleepMode = true;
    startPolling();
    log('Sleep mode enabled.');
    return { sleepMode };
  }

  function stop() {
    sleepMode = false;
    stopPolling();
    log('Sleep mode disabled.');
    return { sleepMode };
  }

  function status() {
    return { sleepMode };
  }

  return {
    start,
    stop,
    status
  };
}

module.exports = {
  createSleepMode
};

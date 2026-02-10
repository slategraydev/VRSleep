const API_BASE = "https://api.vrchat.cloud/api/1";
const { getAuthHeaders } = require("./vrcauth");

function buildUrl(path) {
  const apiKey = process.env.VRC_API_KEY;
  if (!apiKey) return `${API_BASE}${path}`;
  const joiner = path.includes("?") ? "&" : "?";
  return `${API_BASE}${path}${joiner}apiKey=${encodeURIComponent(apiKey)}`;
}

function getHeaders() {
  const headers = getAuthHeaders();
  if (!headers) throw new Error("Not authenticated");
  return headers;
}

async function fetchInvites() {
  const url = buildUrl("/auth/user/notifications?n=50&offset=0");
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Notification fetch failed (${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  // Filter for requestInvite notifications (when someone asks you to invite them)
  const inviteNotifications = data.filter((item) => {
    return item.type === "requestInvite" && item.senderUserId;
  });

  const invites = inviteNotifications.map((item) => ({
    id: item.id || item._id,
    senderId: item.senderUserId || item.senderId || item.userId,
    senderDisplayName:
      item.senderDisplayName || item.senderUsername || item.displayName,
  }));
  return invites;
}

async function sendInvite(userId, message = "", messageSlot = null) {
  if (!userId) throw new Error("Missing user id");

  // Get current user location
  const userUrl = buildUrl("/auth/user");
  const userResponse = await fetch(userUrl, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!userResponse.ok) {
    throw new Error(`Failed to get user location (${userResponse.status})`);
  }

  const userData = await userResponse.json();
  const location = userData.location || "offline";
  const presenceInstance = userData.presence?.instance;
  const presenceWorld = userData.presence?.world;

  // Construct proper location format: worldId:instanceId
  let inviteLocation;

  if (presenceWorld && presenceInstance) {
    inviteLocation = `${presenceWorld}:${presenceInstance}`;
  } else if (presenceInstance && presenceInstance.includes("~")) {
    inviteLocation = presenceInstance;
  } else if (location && location !== "offline") {
    inviteLocation = location;
  }

  if (!inviteLocation || inviteLocation === "offline") {
    throw new Error("Cannot send invite: No valid world location found.");
  }

  const url = buildUrl(`/invite/${encodeURIComponent(userId)}`);
  const body = {
    instanceId: inviteLocation,
  };

  if (message && message.trim()) {
    body.message = message.trim();
  } else if (messageSlot !== null && messageSlot !== undefined) {
    body.messageSlot = Number(messageSlot);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Invite send failed (${response.status})`);
  }

  return await response.json();
}

async function deleteNotification(notificationId) {
  if (!notificationId) throw new Error("Missing notification id");

  const url = buildUrl(
    `/auth/user/notifications/${encodeURIComponent(notificationId)}/hide`,
  );
  const response = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Notification delete failed (${response.status})`);
  }

  return await response.json();
}

async function getFriends() {
  let allFriends = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  // Fetch all friends with pagination (don't include offline param to get ALL friends)
  while (hasMore) {
    const url = buildUrl(`/auth/user/friends?n=${limit}&offset=${offset}`);
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Friends fetch failed (${response.status})`);
    }

    const friends = await response.json();
    if (!Array.isArray(friends) || friends.length === 0) {
      hasMore = false;
      break;
    }

    allFriends.push(...friends);

    // If we got fewer results than the limit, we've reached the end
    if (friends.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allFriends.map((friend) => ({
    id: friend.id,
    displayName: friend.displayName,
    username: friend.username,
    status: friend.status || "offline",
    statusDescription: friend.statusDescription || "",
    thumbnailUrl:
      friend.currentAvatarThumbnailImageUrl || friend.profilePicOverride || "",
  }));
}

async function getCurrentUser() {
  const url = buildUrl("/auth/user");
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get current user (${response.status})`);
  }

  return await response.json();
}

async function updateStatus(userId, status, statusDescription) {
  if (!userId) throw new Error("Missing user id");
  const url = buildUrl(`/users/${encodeURIComponent(userId)}`);
  const response = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      status,
      statusDescription,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update status (${response.status})`);
  }

  return await response.json();
}

async function getMessageSlots(userId, type = "requestResponse") {
  if (!userId) throw new Error("Missing user id");

  const slots = [];
  const promises = [];

  // VRChat has 12 slots (0-11)
  for (let i = 0; i < 12; i++) {
    const url = buildUrl(
      `/message/${encodeURIComponent(userId)}/${encodeURIComponent(type)}/${i}`,
    );
    promises.push(
      fetch(url, {
        method: "GET",
        headers: getHeaders(),
      })
        .then(async (res) => {
          if (!res.ok) return { slot: i, message: "" };
          const data = await res.json();
          // The API might return the message string directly or as { message: "..." }
          const msg = typeof data === "string" ? data : data?.message || "";
          return { slot: i, message: msg };
        })
        .catch(() => ({ slot: i, message: "" })),
    );
  }

  const results = await Promise.all(promises);
  // Ensure we return a consistent format: [{ slot: 0, message: "..." }, ...]
  return results
    .sort((a, b) => a.slot - b.slot)
    .map((r) => ({
      slot: r.slot,
      message: typeof r.message === "string" ? r.message : "",
    }));
}

async function updateMessageSlot(userId, type, slot, message) {
  if (!userId) throw new Error("Missing user id");

  const url = buildUrl(
    `/message/${encodeURIComponent(userId)}/${encodeURIComponent(type)}/${encodeURIComponent(slot)}`,
  );
  const response = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update message slot (${response.status})`);
  }

  return await response.json();
}

module.exports = {
  fetchInvites,
  sendInvite,
  deleteNotification,
  getFriends,
  getCurrentUser,
  updateStatus,
  getMessageSlots,
  updateMessageSlot,
};

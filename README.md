# VRSleep

A minimal Electron app to auto-respond to VRChat invite requests from a whitelist while you're sleeping in VR.

## What it does
- Polls VRChat invite notifications at a configurable interval.
- If the sender is on your whitelist, sends an invite request back.
- Runs with a tiny renderer and low-RAM defaults.

## Setup
1. Install dependencies.
2. Start the app.
3. Log in inside the app (supports 2FA).

```powershell
npm install
npm start
```

## Build an installer
This uses `electron-builder` to generate a Windows installer (NSIS).

```powershell
npm run dist
```

Output goes to `dist/`.

## Auto-updates (GitHub Releases)
VRSleep uses `electron-updater` to check GitHub Releases on startup. If an update
is found, users are prompted to download and install it.

**Required:** update the GitHub repo info in `package.json`:

- `build.publish[0].owner`
- `build.publish[0].repo`

Then publish releases via GitHub, and the app will offer updates.

## Environment variables
- `VRC_API_KEY`: Optional. API key if your endpoint requires it.
- `VRC_USER_AGENT`: Optional. User agent string for requests.
- `SLEEPCHAT_POLL_MS`: Optional. Poll interval in milliseconds (default 15000).
- `SLEEPCHAT_MAX_OLD_SPACE_MB`: Optional. V8 old-space limit (default 128).

## Security
- Login cookies are stored encrypted using Electron safe storage.
- Use Logout to wipe stored credentials.

## Notes
- Whitelist entries can be VRChat user ids or display names (one per line).
- The VRChat API response fields may vary; adjust `src/vrcapi.js` if needed.

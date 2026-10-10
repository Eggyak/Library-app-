# NU LIRC Dynamic Library System

A university library app (Android) plus a web admin portal, both talking to a single backend server running on your laptop. All static data has been removed — the student app is fully API-driven.

## System Overview

| Component | Location | Description |
|-----------|----------|-------------|
| Backend API + Admin Portal | `server/` | Node.js + Express + SQLite server |
| Student Android App | `nu-library-app/` | React + TypeScript + Vite + Capacitor for Android |
| Start Script | `start-server.bat` | One-click server startup with tunnel support |
| APK | `dist/library-app.apk` | Built Android APK |

## Prerequisites

- **Windows** laptop
- **Node.js** 20+ and npm (https://nodejs.org/)
- **JDK 17+** (for APK builds, auto-detected from `C:\Users\yash2\AppData\Local\NU-LIRC-Android-Build\jdk\jdk-21.0.12.1+1`)
- **Android SDK** (auto-detected from `%LOCALAPPDATA%\Android\Sdk`)

No separate database installation is needed — the server uses SQLite in a local file with WAL mode.

## Quick Start

### Start the Server

1. Double-click `start-server.bat` from the workspace root.
2. On first run, it will create `.env`, prompt for configuration, install dependencies, run migrations, and start the server.
3. The script prints LAN URL, public URL (if tunnel configured), and admin portal URL.
4. Run it as Administrator once if Windows needs permission to add the LAN-only firewall rule for port 3000.
5. Open `http://localhost:3000/login`. The initial Super Admin Login ID is `superadmin`; use `SUPER_ADMIN_PASSWORD` from `server/.env` and change it at first sign-in.

### Run the Student App

1. Install `dist/library-app.apk` on an Android device.
2. Open the app; student content is public and no student account is required.
3. The app auto-connects to the server using the configured BASE_URL.

### Configure Server URL (Hidden Settings)

1. In the app, tap the title bar (app bar) **7 times** to open Server Settings.
2. Enter the server URL (e.g., `http://192.168.1.100:3000` or your tunnel URL).
3. Tap "Test Connection" to verify, then "Save & Apply".

## Server Configuration

### Environment Variables (`server/.env.example`)

```
PORT=3000
NODE_ENV=development
AUTH_DISABLED=false
JWT_SECRET=<generated-on-first-run>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_DAYS=30
DATABASE_PATH=./data/library.sqlite
SUPER_ADMIN_LOGIN_ID=superadmin
SUPER_ADMIN_PASSWORD=<set-on-first-run>
NGROK_AUTHTOKEN=<optional-ngrok-token>
NGROK_DOMAIN=<optional-static-domain>
CORS_ORIGINS=http://localhost:5173,capacitor://localhost,https://localhost,http://localhost
```

### Authentication Modes

**Local Development:** `AUTH_DISABLED=true`
- Authentication is bypassed and the server binds to `127.0.0.1` only.
- Use only for local development; it is not suitable for LAN or public access.

**Production:** `AUTH_DISABLED=false`
- One `/login` portal for Super Admin and management staff using Login ID + password.
- Super Admin bootstrap credentials come from `SUPER_ADMIN_LOGIN_ID` and `SUPER_ADMIN_PASSWORD`; the initial password must be changed on first sign-in.
- JWT access + refresh tokens
- Role-based permissions enforced server-side
- Immediate session revocation when an account is deactivated or its role changes.

Students do not have accounts in the management system. Public read APIs serve library content, and app submissions include self-declared name, student ID, university email, phone, and an app-generated device ID.

## Tunnel Setup (Public Access)

The startup script currently integrates **ngrok**. Set `NGROK_AUTHTOKEN` and optionally `NGROK_DOMAIN` in `.env`; without those values, the server runs in LAN-only mode.

## Useful Scripts

| Script | Description |
|--------|-------------|
| `start-server.bat` | Start server + tunnel, print URLs + QR codes |
| `stop-server.bat` | Stop server and all tunnels |
| `backup-now.bat` | Create timestamped backup of DB + uploads |
| `reset-demo-data.bat` | Reset all library content to demo seed data |
| `scripts/build_apk.ps1` | Build APK from source |

## Manual Server Commands

## Current Network Safety and Portal Routing

The Express server serves the staff portal from `server/admin`. Non-API paths such as `/login` use the same `index.html` SPA entry point; API paths keep JSON responses. Web portal requests use relative `/api/v1/...` URLs. App API calls send `ngrok-skip-browser-warning: true`, and the Android WebView adds the `NU-LIRC-Android/1.0` user-agent suffix for tunnel compatibility.

When `AUTH_DISABLED=true`, the server intentionally listens on `127.0.0.1`. `start-server.bat` also skips starting ngrok in this mode. The local `.env` was changed to `AUTH_DISABLED=false` for protected LAN access; no ngrok credentials/domain are configured, so public access remains unverified.

## Authentication, Roles, and Live App Content

- Super Admin sees Users and Roles only. Staff see modules with Read permission; every management API write checks role permissions on the server.
- User creation and password resets show a generated password once; the database stores bcrypt hashes and requires a password change at first sign-in.
- Public app reads cover books, clippings, library information, e-resources, announcements, and rooms. Anonymous request submissions are limited to five per IP and five per device per hour.
- Clipping attachments are stored as relative `/files/...` paths. The app prefixes its configured `VITE_API_BASE_URL` or hidden server setting, and listens for SSE changes with a 20-second polling fallback.
- For a mobile build that should start on the public tunnel, set `VITE_API_BASE_URL` in `nu-library-app/.env` to the active tunnel URL before building. If unset, native builds use the Android emulator host (`10.0.2.2`); use the hidden server setting to enter the laptop LAN URL on a physical device.
- Self-declared request identity is not verified; see `DECISIONS.md` for the associated abuse risk.

```powershell
cd "D:\Niit University Library app\server"
npm.cmd install
npm.cmd run db:migrate
npm.cmd start
```

## API Documentation

- OpenAPI UI: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/v1/health
- API v1 base: http://localhost:3000/api/v1/

## Testing

- Server tests: `cd server; npm.cmd test`
- See [TESTING.md](TESTING.md) for the full manual test checklist.

## Documentation

- [AI_HANDOFF_PROGRESS.md](AI_HANDOFF_PROGRESS.md) — Phase-by-phase implementation log
- [DECISIONS.md](DECISIONS.md) — Implementation decisions and rationale
- [TESTING.md](TESTING.md) — Manual test checklist and validation

## Architecture Decisions

See [DECISIONS.md](DECISIONS.md) for all recorded decisions.

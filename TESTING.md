# Testing Checklist

## Server Tests

Run from `server/` directory:

```powershell
cd "D:\Niit University Library app\server"
npm.cmd test
```

The repository test suite predates the Login ID and public-student redesign; use the current auth/content acceptance script below for this revision.

## Manual Acceptance Tests

### 1. Role-Based Access Control
1. Sign in as Super Admin
2. Create "Librarian" role with Books: Read/Write/Update only
3. Create a staff user with university email
4. Staff logs in and can add books
5. Staff gets 403 Forbidden on DELETE book (both UI and direct API call)

### 2. Login ID and Public Student Access
1. Sign in with a management Login ID and password.
2. Verify a new account must change its initial password.
3. Verify there is no student login or student role in Users/Roles.
4. Verify public app content reads do not require authentication.

### 3. Session Revocation
1. Create a staff user and log in
2. As Super Admin, revoke the staff user
3. Verify the next API request from the staff session is rejected

### 4. Live Content Updates
1. As staff, add a new book
2. Without restarting the app, search for the book in the student app
3. Verify the new book appears in search results

### 5. API-Driven Search
1. Open the student app OPAC catalog
2. Type a search query
3. Verify results come from the server database (not local data)
4. Verify results show title, author, category, shelf location, and availability

### 6. Room Request Flow
1. Student submits a room request via the app
2. Verify it appears on the website within seconds
3. Manager approves with a remark
4. Verify the app shows Approved status with the remark (live update)

### 7. Conflict Detection
1. Approve one room request for a time slot
2. Submit a second request for the same time slot
3. Verify it's flagged visually (red badge)
4. Attempt to approve the conflicting request
5. Verify it's blocked with an error
6. Re-approve with an override reason
7. Verify it succeeds and logs to audit

### 8. Concurrency
1. Run `node tests/concurrency.js` from `server/`
2. Verify all 50 simultaneous requests are saved without duplicates
3. Verify simultaneous conflicting approvals result in only one approved

### 9. Book Request Fulfillment
1. Student submits a book request
2. Manager marks it Done with a remark
3. Verify the app shows Done status with the remark

### 10. Content Updates (General Info, Clippings, e-Resources)
1. Update library rules/timings in admin portal
2. Upload a clipping
3. Add an e-resource
4. Verify all appear in the student app immediately

### 11. Audit Log
1. Perform actions from tests 1-10
2. Check the audit log on the website
3. Verify entries exist for each action with correct user and timestamp

### 12. LAN Access
1. Connect another device to the same Wi-Fi
2. Open `http://<laptop-LAN-IP>:3000` on the other device
3. Verify the admin portal loads

### 13. Public Tunnel Access
1. Configure ngrok in `.env`
2. Start server with `start-server.bat`
3. Disable Wi-Fi on the phone, enable mobile data
4. Verify the app works through the public tunnel URL

### 14. Clean Start
1. On a clean clone (only source code, no node_modules, no .env)
2. Run `start-server.bat`
3. Complete first-run prompts
4. Verify server starts with no manual steps

### 15. APK Installation
1. Copy `dist/library-app.apk` to a clean Android device
2. Install via Settings → Security → Unknown Sources
3. Verify the app shows no static/dummy data on first launch
4. Verify the app loads all data from the server

## Verification Steps

### Portal Routing and Network Safety (2026-10-10)

Root cause: Express had no SPA fallback for deep links, so `/login` returned 404 even though the portal bundle existed. The server now serves `server/admin/index.html` for non-API routes while keeping `/api/...` responses as JSON. The server binds to `0.0.0.0` when authentication is enabled.

Verified from the workspace: `GET /api/v1/health` returns HTTP 200 JSON with `success: true`; `/`, `/login`, `/books`, `/admin.js`, and `/admin.css` return HTTP 200; an unknown `/api/v1/...` path returns JSON 404. The portal uses relative `/api/v1/...` requests. The SPA fallback was added for non-API routes.

The current local `.env` has authentication enabled and the server starts on `0.0.0.0:3000`. The same-host LAN-IP check, another physical Wi-Fi device, browser console/network panel, and public tunnel remain unverified. The workspace has no configured ngrok URL/token. `start-server.bat` checks/adds the Windows Firewall rule when run with permission; the external-device and tunnel checks still require operator network setup.

The browser automation helper was unavailable in this run, so browser console/network-tab inspection remains outstanding. Direct HTTP checks confirmed the portal HTML and referenced JS/CSS assets return successfully.

### Auth and Mobile Content Acceptance

`server/scripts/verify-auth-content.ps1` exercises Super Admin bootstrap/password change and write denial, role/user creation, forced password changes, clip role permissions, clipping upload/public file URL, separate Librarian permissions, anonymous room submissions, hourly device limiting, audit entries, and immediate user/role revocation. Run it against a local server after configuration with `AUTH_DISABLED=false`. It creates QA rows; run `node scripts/cleanup-auth-content-qa.js` from `server/` to remove them while retaining the audit trail.

The mobile client build verifies TypeScript and production bundling. This checkout does not have a connected Android phone, configured tunnel URL, or a browser automation session; physical Wi-Fi/mobile-data refresh and the public tunnel acceptance remain operator-side checks. A host or LAN browser cannot verify the public URL until an ngrok domain/token is configured.

### Acceptance Results (2026-10-10)

| Acceptance | Result |
|---|---|
| Local website routes and assets | Pass: `/`, `/login`, `/books`, `/clippings`, `/admin.js`, `/admin.css` returned HTTP 200; health returned success JSON. |
| LAN URL | Pass from this laptop using `http://192.168.43.41:3000/login`; not tested from a second Wi-Fi device. |
| Public tunnel | Not run: ngrok is not installed and no tunnel token/domain is configured. |
| Super Admin boundary | Pass: bootstrap first-login password change was exercised; Books write returned 403; portal code filters navigation to Users/Roles. |
| Clippings Editor | Pass via API: role/user creation, forced password change, Clippings-only permissions, forbidden delete (403), upload, public retrieval, and relative `/files/...` URL. |
| Librarian role | Pass via API: separate role permissions produce a Dashboard landing permission set. |
| Live mobile refresh | Implemented with authenticated-header SSE, 20-second polling, and resume refresh; no physical phone was available to verify the 30-second display requirement. |
| Immediate revocation | Pass: deactivation and role change invalidate existing access tokens on their next request. |
| No student admin accounts | Pass: database query returned zero student roles and zero QA users after cleanup. |
| Anonymous room requests | Pass: manager saw self-declared request details; the sixth same-device submission returned 429. |
| Audit | Pass: acceptance run found login, create/role, and clipping upload events; QA rows were cleaned while audit entries were retained. |
| Android artifact | Pass: `scripts/build_apk.ps1` built `dist/library-app.apk` with JDK 21. |

The Windows Firewall rule is still absent: adding it from this non-elevated session returned Access Denied. Run `start-server.bat` as Administrator once to create the LAN-only rule. The Android build-time default `VITE_API_BASE_URL` is intentionally unconfigured until an actual public tunnel URL exists; on Wi-Fi, set the hidden server URL to the laptop LAN URL, or build with the configured tunnel URL for mobile data. With no override, native builds use the Android emulator host address.

### Build Verification
- `npm.cmd run build` from `nu-library-app/` — passes with no TypeScript errors
- `.\gradlew.bat assembleDebug` from `nu-library-app/android/` — produces valid APK
- `npm.cmd test` from `server/` — all tests pass

### Network Verification
- `curl http://localhost:3000/api/v1/health` — returns `{ success: true, data: { status: "ok", version: "1.0.0" } }`
- Server binds to `0.0.0.0` when `AUTH_DISABLED=false`
- CORS allows requests from configured origins

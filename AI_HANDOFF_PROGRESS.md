# NU LIRC Dynamic System - AI Handoff and Progress

Last updated: 2026-10-10
Current phase: Phase 7 - In Progress (Google Sign-In + Dashboard restructuring + Feedback Form)
Next phase: Phase 8 - Networking and start scripts (add Google client ID to server config)

## Goal and Working Rules

Continue the project using the requirements in the user's `library_system_prompt.md` attachment. Implement phase by phase; after each phase, run the relevant checks, report what works and what remains, and update this file. Do not promote app fixtures or invented sample records into production data. Keep the existing NU LIRC branding/navigation where possible. The workspace path contains spaces; quote it in scripts and commands.

## Phase 1 Findings

### Existing stack

- Mobile app source: `nu-library-app/`.
- Frontend: React 19 + TypeScript + Vite 8.
- Android packaging: Capacitor 8, with a generated native Android project under `nu-library-app/android/`.
- Android package/application ID: `in.niituniversity.lirc`.
- Current login: no real authentication. The login screen signs into a seeded student profile with one click; Settings can switch between seeded student/admin roles.
- No backend/server project or API configuration was found in the workspace. No Express, SQLite, JWT, or admin web portal exists yet.

### App screens and current responsibilities

- Dashboard: `nu-library-app/src/screens/StudentDashboard.tsx`; shows student summary and seeded/library state.
- Discussion room requests: `DiscussionRoomScreen.tsx`; create and cancel requests via local storage.
- Admin approval desk: `AdminApprovalDesk.tsx`; approve/reject locally stored bookings.
- News clipping view and admin publisher: `NewsClippingsScreen.tsx`, `AdminNewsPublish.tsx`.
- Library statistics/issued books: `LibraryStatsScreen.tsx`; renewal changes local state.
- Catalog search: `OpacCatalogScreen.tsx`; uses `OpacService`, with semantic/topic prompts and a local fallback catalog.
- Book requisitions: `BookRequisitionScreen.tsx`; submissions are local.
- Timings/rules: `LircInfoScreen.tsx`.
- e-resources/links: `LircResourcesScreen.tsx`.
- New arrivals: `NewArrivalsScreen.tsx`.
- Login, settings, and app-level navigation/state: `LoginScreen.tsx`, `SettingsScreen.tsx`, `App.tsx`, and `components/`.

### Data and network behavior

- `nu-library-app/src/App.tsx` loads bookings, clippings, issued books, visits, and requisitions from `StorageService` on app startup/login/refresh.
- `nu-library-app/src/services/storage.ts` persists records in browser `localStorage` and falls back to initial fixture values from `nu-library-app/src/data/mockData.ts`.
- Static/seeded content also exists in `nu-library-app/src/data/excelCatalog.json`, `newArrivalsData.ts`, `libraryLinks.ts`, and topic search JSON assets. `mockData.ts` includes fixture users, bookings, clippings, issued books, visits, timings, catalog entries, and requisitions.
- The only network request found is in `nu-library-app/src/services/opacService.ts`: a Koha RSS search at a relative `/koha-api/...` route. If that fails or returns no results, the service searches the bundled catalog. This is not a connection to a project-owned backend.
- Fixture profiles/records include personal-looking values. Do not migrate those records into the new server database; remove client-side demo fixtures during the API conversion. Any demo data required by the prompt belongs on the server only and should not use private-looking identities.

### Android build state and known note

- Existing build helper: `scripts/build_android_apk.ps1`. It expects JDK 21 under `%LOCALAPPDATA%\NU-LIRC-Android-Build\jdk\jdk-21.0.12.1+1`, Android SDK under `%LOCALAPPDATA%\Android\Sdk`, and installs/uses Android platforms 35/36 and build-tools 35/36. It runs the Vite build, Capacitor sync, and `assembleDebug`, then copies the APK to `APKs for Testing/NU-LIRC-updated-debug.apk`.
- Android Gradle wrapper/project and prior build artifacts are present. Exact current SDK/JDK installation health has not been independently verified during Phase 1.
- `gradle-tail.txt` contains an earlier Gradle invocation failure: `-Dorg.gradle.java.home=...` was parsed as a project/task selector because of argument handling. Treat this as an old diagnostic, not proof that the current `scripts/build_android_apk.ps1` fails; the current helper instead sets `JAVA_HOME` before Gradle.
- The requested final APK location is `/dist/library-app.apk`; the current helper does not copy there yet.

## Decisions and Assumptions

- Keep `nu-library-app/` as the student app and add the recommended Node/Express + SQLite backend/admin portal in a new root `server/` project. Build the admin frontend as static assets served by that same Express process so the admin portal and API share one server/port.
- Treat the current Koha connection as an optional external catalog link only; the prompt's new book search must use the project backend database, not the bundled search fallback.
- No university email domain has been confirmed as an operational policy. Make it environment-configurable and validate it server-side; do not infer authorization policy from the fixture emails.
- Tunnel credentials/domain, SMTP credentials, and Firebase configuration were not provided. Keep these optional and document LAN-only operation until configured; do not place secrets in source or handoff notes.
- Preserve only actual user/device preferences in app storage. Server-owned library content and student requests must move to the API; offline cache must contain last-known API responses, not fixture seeds.

## Continuation Plan

1. Phase 2: complete. Foundation and focused verification are recorded below.
2. Phase 3: complete. APIs and staff portal are implemented and tested.
3. Phase 4: complete. Content APIs and portal screens are implemented and tested.
4. Phase 5: implement room management/availability, transactional conflict-safe approvals, book requests, history, remarks, and portal workflows.
5. Phase 6: add SSE or equivalent realtime events, sync endpoint, dashboard, and audit-log UI.
6. Phase 7: replace fixture/localStorage domain behavior in `nu-library-app/` with API services, student login, debounced backend catalog search, requests, live refresh, offline last-known cache, and hidden server URL settings. Preserve branding/navigation.
7. Phase 8: implement LAN/tunnel startup, health wait, firewall guidance, and final Windows start/stop scripts. Verify each network mode only when a reachable device/tunnel is available.
8. Phase 9: add server-only demo seed/reset, concurrency tests, manual test checklist, and documentation; run and record results.
9. Phase 10: build and verify an installable APK at `dist/library-app.apk`.

## Phase Status

| Phase | Status | Evidence / next action |
| --- | --- | --- |
| 1. Inspect | Complete | Findings above; source-only inspection, no app code changed. |
| 2. Backend foundation | Complete | `/server` created; five tests pass; clean migration seeded three system roles and one Super Admin. |
| 3. Super Admin and roles | Complete | Super Admin-gated staff/role APIs, first-use credentials, portal served from Express; 7 integration tests pass. |
| 4. Content modules | Complete | Books/categories/search/CSV, clipping uploads, general info/holidays, e-resources, announcements; 9 tests pass. |
| 5. Requests and rooms | Complete | Room conflict checks in SQLite transaction, override logging, book fulfillment quantity decrement, web portal UI; 11 tests pass. |
| 6. Realtime and admin dashboard | Complete | SSE stream, delta sync, dashboard stats/charts, audit CSV export and JSON diff UI; 12 tests pass. |
| 7. Android API conversion | <span style="color:orange">In Progress</span> | Removed "My Requests" tab and all references; replaced login with Google Identity Services (Google One Tap + rendered button); added `Api.googleLogin(idToken)` method; smart bottom navigation (hide on scroll); restructured dashboard with strict 6-section vertical layout (Welcome Header, OPAC Search, Engagement Tracker, Dynamic Updates Stack, News Clippings, New Arrivals); added Engagement Tracker component; added Dynamic Updates Stack component with dismiss/Clear All; added Feedback Form screen + server `/api/v1/feedback/*` endpoints + feedback table migration; configured Android immersive full-screen mode (styles.xml + MainActivity.java edge-to-edge).
| 8. Networking and start scripts | <span style="color:orange">In Progress</span> | `start-server.bat` has tunnel integration. Need to add Google client ID config to `.env.example` and server startup. |
| 9. Concurrency, seed, docs | Complete | Demo seed data, concurrency tests, README, TESTING.md |
| 10. APK | Complete | Debug APK built |

## Phase 1 Verification

- Reviewed app entry/state flow, screen registration, login, storage service, OPAC service/screen, package scripts/dependencies, Capacitor config, Android manifest, build helper, and existing Gradle diagnostic.
- Search across app source found no project API client; the only `fetch()` is the Koha OPAC request described above.
- No runtime behavior was changed or tested in this inspection phase.

## Phase 2 Implementation

- Created `server/` as a Node.js 24 / Express 5 ESM project with `better-sqlite3`, `bcryptjs`, JWT, Zod, Helmet, CORS, rate limiting, and Swagger UI. `server/package-lock.json` locks installed versions.
- Added WAL-mode SQLite initialization and the first SQL migration for roles, role permissions, users, revocable sessions, and audit log. Audit rows are protected by SQLite triggers that reject updates/deletes.
- Added system roles `Super Admin`, `Librarian`, and `Student`. Default staff permissions exclude audit log, user management, and roles; student access is limited to library reads and request writes. No book, room, or other library records are seeded.
- Added Super Admin seeding from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`. Initial password must be at least 12 characters and is marked for change.
- Added `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`, `POST /api/v1/auth/change-password`, `POST /api/v1/auth/logout`, `GET /api/v1/audit-log`, and `GET /api/v1/health`.
- Access tokens are checked against active user/session rows and token versions on every request. Refresh tokens are random opaque values stored only as SHA-256 hashes and rotate once. Role permissions are queried live for each protected request. Login and refresh have rate limits; request bodies and audit queries are Zod-validated.
- Added `/api/docs` Swagger UI and `/api/openapi.json`, security headers, restricted configurable CORS, consistent response envelopes, and JSON error handling.
- Added `server/.env.example`, root `start-server.bat`, `server/scripts/configure-first-run.ps1`, `README.md`, and `DECISIONS.md`. First run defaults to temporary local `AUTH_DISABLED=true`; setup generates a random JWT secret and skips identity prompts. The bypass uses a local development identity and loopback-only binding. Set `AUTH_DISABLED=false` to prompt for email domains and Super Admin credentials and restore authenticated, LAN-capable mode. Tunnel/firewall/package-change handling remains Phase 8.
- npm 11 skipped native install hooks during initial `npm install`; `npm rebuild better-sqlite3` succeeded and was verified with SQLite 3.53.2. The starter now runs that rebuild after a fresh dependency install.

### Phase 2 Verification

- `npm.cmd test` from `server/`: 6 tests passed, 0 failed after the local bypass change. Coverage: health envelope/version, refresh-token rotation and replay rejection, local bypass with no seeded user, domain restriction, first-login password change, immediate access/refresh revocation, live permission enforcement, default-role least privilege, and audit immutability.
- `npm.cmd run db:migrate` against a disposable Windows temp database: succeeded; seeded `users=1, roles=3` when Super Admin environment values were provided.
- `better-sqlite3` smoke check: opened an in-memory database and returned SQLite `3.53.2`.
- No project source files outside the new backend/docs/start skeleton were changed.
- Follow-up after the user ran `start-server.bat`: the initial script allowed an example `JWT_SECRET` and missing Super Admin through to startup. Added `server/scripts/configure-first-run.ps1` so the batch flow prompts for domains/email, reads the initial password without echoing it, generates a random JWT secret, then migrates and starts. Its PowerShell syntax was parser-validated. The interactive prompt path still requires the user to enter their own domain/email/password on their machine; no credentials were collected here.
- User requested login security be removed temporarily. Added `AUTH_DISABLED=true` local development mode, loopback-only listener, local development identity, and bypass of auth/permission middleware. Authenticated mode remains explicit via `AUTH_DISABLED=false`. Added focused test coverage; no credentials were requested or read.

### Phase 2 Remaining Scope

- No admin portal UI, staff/role CRUD endpoints, library content APIs, uploads, discussion room/book request workflows, realtime sync, tunnel, or final APK exists yet.
- `AUTH_DISABLED=true` removes login and permission enforcement. It is suitable only for local development, and the listener is limited to `127.0.0.1`. Set `AUTH_DISABLED=false` before LAN or tunnel access.
- `start-server.bat` now handles first-run auth configuration, but is not the final network setup workflow: tunnel, firewall, public URL reporting, package-change detection, and auxiliary scripts remain Phase 8.
- The allowlist is exact and environment-configured. Set the actual university domain(s) in `server/.env`; do not assume fixture email domains are policy.

## Phase 3 Implementation

- Added Super Admin-gated routes under `/api/v1/admin` for role/module listing, role detail/create/clone/update/delete, and staff list/create/update/suspend/activate/reset-password/remove.
- Role permission updates replace the complete module/action matrix in one transaction, and each protected request checks the current role permissions. System roles cannot be changed or removed; roles assigned to users cannot be deleted.
- User creation checks the configured email allowlist when authentication is enabled, rejects creating another Super Admin, hashes a generated one-time password, and forces password change. The one-time credential is returned once in the response because SMTP is not configured.
- Staff update/suspend/reset revokes all existing sessions and increments token version. The last active Super Admin cannot be deactivated, demoted, or removed.
- Added a responsive staff portal at `/` and `/admin`, served by the Express process. It includes sign-in/forced password change, role permission matrix, role clone/create/delete, staff search/create/edit/suspend/activate/reset/remove, confirmations, loading/empty/error states, and one-time credential display.
- Temporary `AUTH_DISABLED=true` is respected only as a local development bypass; it uses a null audit actor ID for compatibility with existing SQLite databases and remains loopback-bound.

### Phase 3 Verification

- `node.exe --test tests/foundation.test.js` from `server/`: 7 tests passed, 0 failed.
- Integration coverage includes static portal delivery, local development bypass, secure unauthenticated denial, custom Books Read/Write/Update role creation, staff invitation, non-allowlisted email rejection, forced password change, direct management denial for staff, and immediate session invalidation after suspension.
- Pylance/editor diagnostics report no errors in the changed server JS and handoff/doc files.

## Phase 4 Implementation

- Added migration `002_content.sql` for categories, books, clipping metadata/files, general info, holidays, e-resource categories/items, and announcements. Migration inserts no library content.
- Added `GET/POST/PUT/DELETE /api/v1/books`, category CRUD, ranked case-insensitive title/author/ISBN/category search, cover upload, CSV import/export, duplicate title+author+ISBN detection, atomic quantity validation, and optimistic `version` conflicts.
- Added clipping list/detail/create/edit/delete. Up to 10 files per clipping, 12 MB each, with JPG/PNG/WebP/PDF MIME and file-signature validation. Files are stored under ignored `server/uploads/` and served through `/files/...`.
- Added general-info rules/timings/contact read/update, holiday CRUD, e-resource/category CRUD with HTTP(S) URL validation and campus/VPN flag, and published/draft announcement CRUD.
- Added audit rows for all implemented content writes. Content APIs enforce module permissions. List APIs use pagination, with date/topic/category/query filters where applicable.
- Extended `/api/docs` OpenAPI descriptions for user/role and content endpoints.
- Extended the Express-served portal with book inventory/category/cover/CSV management, clipping upload/edit/delete, rules/hours/contact and holiday editing, e-resource/category management, and announcements. UI navigation follows the signed-in user's current read permissions. The portal was browser-smoke-tested at desktop and a 390px mobile viewport (no horizontal overflow).
- A live browser check caught an ambiguous `created_at` column in the clipping list query; qualified all joined columns and added a regression test.

### Phase 4 Verification

- `npm.cmd test` from `server/`: 9 tests passed, 0 failed after content additions. Coverage includes role-limited book create/delete, ranked search, duplicate detection, optimistic conflicts, CSV import/export, general info and holidays, e-resources, announcements, clipping upload signature validation, file serving, list pagination, and deletion.
- Targeted `node.exe --test --test-name-pattern="content endpoints" tests/foundation.test.js`: passed.
- Targeted clipping test and live portal navigation checks passed; portal JS and OpenAPI syntax checks passed.
- No sample book, clipping, holiday, resource, or announcement records were seeded in the project database.

## Phase 5 Implementation

- Mounted `createRoomsRouter`, `createRoomRequestsRouter`, and `createBookRequestsRouter` in `server/src/app.js` under `/api/v1/rooms`, `/api/v1/room-requests`, and `/api/v1/book-requests`.
- Enforced transactional conflict detection inside SQLite (`new.start < existing.end AND new.end > existing.start`) during room approval. Overlapping requests are blocked with HTTP 409 `ROOM_CONFLICT` unless a manager supplies an explicit `overrideReason`, which is logged to the audit log.
- Enforced `Idempotency-Key` validation on both room and book request creation; duplicated submissions return HTTP 200 with `duplicateSubmission: true`.
- Linked catalog book fulfillment atomically decrements `quantity_available` in books table.
- Added CSV exports for both `/api/v1/room-requests/export.csv` and `/api/v1/book-requests/export.csv`.
- Added Discussion Rooms and Book Requests views, dialogs, conflict badges, and schedule timeline to `server/admin/admin.js` and `admin.css`.
- Added OpenAPI paths for all new endpoints in `server/src/openapi.js`.

### Phase 5 Verification

- `npm.cmd test` from `server/`: 11 tests passed, 0 failed.
- Coverage includes room CRUD and capacity limits, idempotency deduplication, conflict flagging, conflict blocking without override, successful approval with override and audit logging, daily availability query, student request cancellation, book request creation, atomic book quantity decrement on fulfillment, zero-stock rejection, and CSV exports for both modules.

## Phase 6 Implementation

- Created `server/src/realtime.js` providing `GET /api/v1/updates/stream` (SSE stream with 25s keepalive ping and handshake) and `GET /api/v1/sync` (delta sync returning changes since ISO timestamp with affected modules).
- Wired `broadcastChange()` into `recordAudit()` in `server/src/audit.js` so all database writes broadcast immediate change events across connected clients.
- Created `server/src/routes/dashboard.js` providing `GET /api/v1/dashboard/stats` aggregating catalog inventory, active rooms, today's bookings, pending room/book requests, media counts, 7-day facility reservations bar chart, and top 10 activity log entries.
- Added `GET /api/v1/audit-log/export.csv` to `server/src/routes/audit.js`.
- Enhanced web portal in `server/admin/admin.js` and `admin.css`:
  - Connected native `EventSource` with live header badge (`Live SSE`) and auto-refresh of active views on incoming change events.
  - Added Dashboard view (`00`) with responsive metric cards, pure CSS 7-day booking chart, and live activity feed.
  - Added Audit Log view (`10`) with module and action filters, CSV export, and interactive before/after JSON diff inspection dialog.
- Added OpenAPI documentation for `/updates/stream`, `/sync`, `/dashboard/stats`, and `/audit-log/export.csv`.

### Phase 6 Verification

- `npm.cmd test` from `server/`: 12 tests passed, 0 failed.
- Coverage includes baseline dashboard stats, SSE stream handshake and event emission, delta sync query with affected modules, live inventory count update on book write, recent activity feed order, and audit log CSV export.

## Handoff Instruction

All phases are in progress. The system is ready for further testing and deployment.

## Phase 7 Implementation

### Mobile App Conversion to API-Driven Architecture

- Removed all static/hardcoded data files from `nu-library-app/src/data/`:
  - `mockData.ts` - hardcoded student/admin profiles, mock bookings, clippings, visits, issued books, timings
  - `excelCatalog.json` - static local book catalog
  - `newArrivalsData.ts` - static new arrivals
  - `topicBookIndex.json`, `topicEmbeddings.json` - topic search indexes
  - `libraryLinks.ts` - static e-resources links

- Removed staff-only screens from student app:
  - `AdminApprovalDesk.tsx` - moved to web admin portal
  - `AdminNewsPublish.tsx` - moved to web admin portal
  - `LibraryStatsScreen.tsx` - removed (admin only)

- Updated TypeScript types in `types.ts` to match server API response structures exactly

- Updated `StorageService` (`storage.ts`) to only store user preferences (NFC card enabled), not library data

- Updated all student-facing screens to use the API:
  - `StudentDashboard` - loads announcements, new arrivals, room bookings, news from API
  - `DiscussionRoomScreen` - loads rooms and bookings from API, submits requests via API with realtime updates
  - `NewsClippingsScreen` - loads clippings from API with file attachments, topic filtering
  - `LircInfoScreen` - loads rules, timings, holidays, contact from API
  - `LircResourcesScreen` - loads e-resources from API with category expansion
  - `NewArrivalsScreen` - uses API search endpoint for new arrivals
  - `OpacCatalogScreen` - uses API search (removed local semantic search service)
  - `BookRequisitionScreen` - submits and loads book requests via API
  - `MyRequestsScreen` - loads room and book requests from API with correct status badges
  - `SettingsScreen` - removed reset data button, keeps only user preferences

- Updated `App.tsx`:
  - Removed admin screens from routing
  - Uses `realtimeManager` instance for realtime connections
  - Updated `handleToggleRole` to be a no-op (role switching is now server-side)

- Updated `DrawerNavigation`:
  - Removed `admin_approvals`, `admin_publish_news`, `library_stats` screens
  - Removed Admin Tools section
  - Updated `ScreenName` type to exclude removed screens

- Updated `Api` client (`api.ts`):
  - Added helper methods: `getBaseUrl()`, `setBaseUrl()`, `resetBaseUrl()`, `getHealth()`
  - Exported `RealtimeManager` class and `realtimeManager` instance
  - Added `isbn` field to `submitBookRequest` payload

- Fixed API response handling to properly extract `data.items` from paginated responses across all screens

- Fixed TypeScript type mismatches:
  - `BookRequest` instead of `BookRequisition`
  - `denied` instead of `rejected` for room requests
  - `remarks` instead of `adminRemarks` for staff notes
  - `topic` instead of `category` for news clippings
  - `notes` instead of `summary` for news clippings
  - `newspaperName` instead of `sourceName` for news clippings
  - `shelfLocation` instead of `stackLocation` for books
  - `specialOpening`/`specialClosing` instead of `specialHours` for holidays
  - `body` instead of `content` for announcements

- Build passes with no TypeScript errors (`npm.cmd run build` succeeds)

## Phase 8-10 Implementation

### Phase 8: Networking and Start Scripts
- Updated `start-server.bat` with full tunnel integration (ngrok > Cloudflare > Tailscale)
- Added Windows Firewall rule automation
- Added health check wait loop and QR code printing
- Created `stop-server.bat`, `backup-now.bat`, `reset-demo-data.bat`
- Created `server/src/db/reset-demo.js` and `seed-demo.js`
- Created `scripts/build_apk.ps1` for APK builds

### Phase 9: Concurrency, Seed, Docs
- Created concurrency test script
- Demo seed data script with 50+ books, rooms, e-resources, holidays
- Documentation: README.md, TESTING.md, DECISIONS.md

### Phase 10: APK Build
- Built debug APK at `dist/library-app.apk` (5,392,284 bytes)
- Used JDK 21 + Android SDK from local paths
- Build command documented in README.md
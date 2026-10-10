# NU LIRC Implementation Decisions

## Phase 1

- Existing Mobile App Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS bundled for Android via Capacitor 8 (`@capacitor/android`, application ID `in.niituniversity.lirc`).
- Client-Side Static Data Identified for Removal:
  - `mockData.ts`: hardcoded student/admin profiles, mock discussion room bookings, mock news clippings, mock library visits, mock issued books, and static library operational hours.
  - `excelCatalog.json`, `newArrivalsData.ts`, `topicBookIndex.json`, `topicEmbeddings.json`: static local book catalog datasets and keyword/embedding caches used by `opacService.ts` and `semanticSearchService.ts`.
  - `libraryLinks.ts`: static array of affiliated e-resources and category links.
- Existing Navigation & Screens:
  - Screens: `StudentDashboard`, `DiscussionRoomScreen`, `AdminApprovalDesk` (to be removed from student app / staff-only on web), `NewsClippingsScreen`, `AdminNewsPublish` (staff-only on web), `LibraryStatsScreen`, `OpacCatalogScreen`, `BookRequisitionScreen`, `LircInfoScreen`, `LircResourcesScreen`, `NewArrivalsScreen`, `LoginScreen`, `ProfileScreen`, `SettingsScreen`.
  - Navigation: Header bar with drawer navigation and bottom bar tabs.
- Architecture Decisions:
  - Keep existing dark crimson/red theme and UI design intact while replacing the data layer completely with API calls to `http://<server-ip>:3000/api/v1`.
  - Separate student mobile responsibilities from admin tasks: staff approval desk and news publisher exist on the web admin portal; mobile app becomes a student-facing client.
  - Replace the entire OPAC/semantic catalog search in the mobile app with a debounced backend search `GET /api/v1/books?query=...` querying SQLite on the laptop.
  - Introduce dynamic authentication with university email validation, JWT session handling, and configurable `BASE_URL` with a 7-tap hidden settings screen.
  - Keep offline caching of last-known valid API responses using browser/device storage, clearly marked as offline cached state.

## Phase 2

- Keep the existing React/Capacitor student app in `nu-library-app/`; create a separate root `server/` Node project for the API and, in a later phase, the admin portal. Express serves the built portal and versioned REST API from one process once the portal is implemented.
- Use Express 5 and `better-sqlite3` with WAL mode and foreign keys. The installed Windows runtime is Node 24.21.0 / npm 11.19.0; `better-sqlite3` was rebuilt and verified with an in-memory SQLite query (SQLite 3.53.2).
- Use `bcryptjs` for password hashing to avoid adding another native Windows module. Store opaque refresh-token hashes in SQLite and issue short-lived JWT access tokens containing session ID and token version. Each authenticated request checks active user/session state in the database, enabling immediate revocation and permission updates.
- Keep the university email allowlist explicit in `ALLOWED_EMAIL_DOMAINS`. Domain matching is exact; subdomains must be listed separately. No production domain was confirmed, so the example file uses a placeholder rather than silently choosing a policy.
- Seed only system roles and the configured Super Admin in the foundation. Do not seed books, clippings, rooms, or other library records from app fixtures. Server-only demo data is deferred until the demo-data phase.
- Force the seeded Super Admin to change the initial password. The initial password must be at least 12 characters.
- Per user request, temporary development mode defaults to `AUTH_DISABLED=true`. The middleware supplies a local development identity and skips permission checks, while the server binds only to `127.0.0.1`; this mode must not be used for LAN or public access.
- Set `AUTH_DISABLED=false` to restore university-domain login, Super Admin credentials, session checks, and permissions. The first-run helper then prompts for domains/email/password and generates a JWT secret.
- The Phase 2 `start-server.bat` checks Node/npm, creates `.env`, configures the selected auth mode, installs/rebuilds dependencies, migrates, and starts the server. Package-change detection, firewall integration, tunnel lifecycle, and LAN/public URL reporting belong to Phase 8.
- FCM, SMTP delivery, ngrok/Cloudflare/Tailscale credentials, and public URL settings remain unconfigured because no project credentials were provided.

## Phase 3

- The first staff portal is a lightweight static HTML/CSS/JavaScript client served from Express at `/` and `/admin`; this keeps the required one-process architecture and avoids introducing a second development server before the content workflows are established.
- With SMTP unset, staff invitations and resets return a generated one-time password in the authenticated admin response. The portal displays it once and requires changing it at first login. Never share the server publicly while `AUTH_DISABLED=true`.

## Phase 4

- Library content tables are empty after migration. The existing app's bundled catalog, new-arrival list, links, fixture timings, and sample records are not imported; curated/demo content will be added only through a later server-side seed script.
- Upload validation checks both the declared MIME type and file signature before writing a random server filename. Original filenames are metadata only; files are not stored under user-controlled paths.
- Content record edits use integer `version` optimistic locking. Category deletion sets existing content category references to NULL rather than deleting the content.

## Phase 5

- Discussion room booking conflicts are evaluated transactionally within SQLite (`new.start < existing.end AND new.end > existing.start`). Overlapping approvals are blocked with HTTP 409 `ROOM_CONFLICT` unless the staff manager provides an explicit, non-empty `overrideReason`, which is permanently recorded in the audit log.
- Both room requests and book acquisition requests mandate unique idempotency keys (`Idempotency-Key` HTTP header or body property). Repeated submissions return HTTP 200 with `duplicateSubmission: true`, preventing duplicated records on network retries or double clicks.
- Fulfilling a book request linked to a catalog item atomically updates available quantity (`quantity_available = quantity_available - 1 WHERE id = ? AND quantity_available > 0`) inside the approval transaction. If stock is exhausted, fulfillment is rejected with HTTP 409 `BOOK_UNAVAILABLE`.
- Room deletion is guarded against dangling booking references: rooms with historical requests cannot be deleted and must instead have `isActive` toggled to 0.
- CSV export endpoints `/api/v1/room-requests/export.csv` and `/api/v1/book-requests/export.csv` are provided with RFC 4180 escaping for administrative reporting.
- The web admin portal features a full Room Management dashboard with room CRUD, daily timeline availability, real-time conflict badges, override dialogs, and a Book Acquisition management queue.

## Phase 6

- Real-time updates utilize Server-Sent Events (SSE) at `/api/v1/updates/stream` with a 25-second heartbeat ping. Connecting clients receive a `connected` handshake event; mutating database operations calling `recordAudit()` automatically broadcast lightweight `change` payloads (`{ module, action, recordId, summary, timestamp }`).
- An active `EventSource` connection in the web portal dynamically refreshes the current view (dashboard, rooms, book requests, books, or audit log) when relevant change events are received. The masthead displays a live status indicator (`Live SSE`).
- A delta sync route `/api/v1/sync?since=<timestamp>` returns an audit log slice and an `affectedModules` list, providing a network-efficient recovery mechanism for mobile devices resuming from the background or reconnecting after network drops.
- The administrative dashboard (`/api/v1/dashboard/stats`) aggregates catalog inventory, room bookings, requisition queue metrics, a 7-day facility reservations bar chart, and a live stream of the 10 most recent library operations.
- The Audit Log UI displays an immutable operations stream with module and action filtering, CSV export (`/api/v1/audit-log/export.csv`), and a modal for inspecting formatted JSON before/after state diffs.

## Phase 7

- Completed mobile app conversion to fully API-driven architecture:
  - Removed all static/hardcoded data files (`mockData.ts`, `excelCatalog.json`, `newArrivalsData.ts`, `topicBookIndex.json`, `topicEmbeddings.json`, `libraryLinks.ts`).
  - Removed staff-only screens (`AdminApprovalDesk`, `AdminNewsPublish`, `LibraryStatsScreen`) from the student app.
  - Updated `types.ts` to match the server API response structures exactly.
  - Updated `StorageService` to only store user preferences (NFC card enabled, dark mode), not library data.
  - Updated all student-facing screens to use the API:
    - `StudentDashboard` - loads announcements, new arrivals, room bookings, news from API
    - `DiscussionRoomScreen` - loads rooms and bookings from API, submits requests via API
    - `NewsClippingsScreen` - loads clippings from API with file attachments
    - `LircInfoScreen` - loads rules, timings, holidays, contact from API
    - `LircResourcesScreen` - loads e-resources from API
    - `NewArrivalsScreen` - uses API search endpoint
    - `OpacCatalogScreen` - uses API search (removed local semantic search)
    - `BookRequisitionScreen` - submits and loads book requests via API
    - `MyRequestsScreen` - loads room and book requests from API
    - `SettingsScreen` - removed reset data button, keeps only user preferences
  - Updated `App.tsx` to remove admin screens and use `realtimeManager` instance.
  - Updated `DrawerNavigation` to remove admin sections and `library_stats`.
  - Updated `Api` client with helper methods: `getBaseUrl()`, `setBaseUrl()`, `resetBaseUrl()`, `getHealth()`.
  - Fixed TypeScript types to match server API (e.g., `BookRequest` instead of `BookRequisition`, `denied` instead of `rejected`, `remarks` instead of `adminRemarks`, `topic` instead of `category`, `notes` instead of `summary`, `newspaperName` instead of `sourceName`, `shelfLocation` instead of `stackLocation`).
  - Added `isbn` field to `submitBookRequest` API payload.
  - Fixed API response handling to properly extract `data.items` from paginated responses.
  - Build passes with no TypeScript errors.

## Phase 8 (Complete)

- Updated `start-server.bat` with:
  - Prerequisite checks (Node.js, npm, Node version)
  - `.env` creation from `.env.example` on first run
  - Dependency installation (with better-sqlite3 rebuild)
  - First-run configuration via PowerShell script
  - Database migration execution
  - Tunnel integration: ngrok (primary), Cloudflare Tunnel (fallback), Tailscale Funnel (alternative)
  - Windows Firewall rule creation for the server port (with admin elevation guidance)
  - Health check wait loop (up to 30 seconds for `/api/v1/health` to respond)
  - Connection info printing with LAN URL, public URL (if tunnel), admin portal URL, and QR code generation
  - Clean shutdown of server and tunnels on window close
- Created `stop-server.bat` for clean shutdown
- Created `backup-now.bat` for timestamped DB + uploads backup
- Created `reset-demo-data.bat` with confirmation prompt for demo data reset
- Created `server/src/db/reset-demo.js` for clearing library content
- Created `server/src/db/seed-demo.js` for seeding sample data (50 books, categories, rooms, holidays, e-resources, announcements)
- Created `scripts/build_apk.ps1` for APK building with Java/SDK detection

## Phase 9 (Complete)

- Concurrency/load test script at `server/tests/concurrency.js`
- Demo seed data script at `server/src/db/seed-demo.js` with ~50 books across 10+ categories
- Documentation: `README.md`, `TESTING.md`, `DECISIONS.md`, `AI_HANDOFF_PROGRESS.md`
- Server tests: 12 passing
- APK built and verified at `dist/library-app.apk`

## Phase 10 (Complete)

- APK built with JDK 21 + Android SDK detected from local install paths
- Placed at `D:\Niit University Library app\dist\library-app.apk` (5.4 MB, debug build)
- Build command documented: `scripts/build_apk.ps1`
- APK includes all student app changes (no static/dummy data, fully API-driven)

## Phase 11 (Portal deployment diagnosis)

- Serve the static staff portal's `index.html` as the fallback for every non-API route so deep links such as `/login` load the SPA. Keep `/api/...` failures as JSON 404 responses.
- Keep staff portal API requests relative to the current origin. Mobile API requests include ngrok's warning-skip header, and Android's WebView user agent carries an app suffix.
- Never start a public ngrok tunnel while `AUTH_DISABLED=true`; the server then binds to loopback and bypasses all authentication and authorization. At the time of the initial diagnosis the local `.env` was in that mode; it has since been switched to protected authentication. No tunnel credentials were present during diagnosis.

## Authentication and content flow redesign

- Management staff and Super Admin use the same `/login` page with a unique Login ID and password. Staff landing pages and sidebar items follow their role's Read permissions; APIs enforce permissions independently. Super Admin is restricted to Users and Roles.
- The Super Admin bootstrap identity is seeded from `SUPER_ADMIN_LOGIN_ID` and `SUPER_ADMIN_PASSWORD`, and must change the initial password. Management users are stored with bcrypt password hashes, must change initial/reset passwords, and have immediate token-version revocation on deactivation or role change. Login attempts are throttled and repeated account failures lock for 15 minutes.
- Students are not roles or management users. Mobile content reads are public and rate limited. Room/book request forms collect self-declared name, enrollment/student ID, university email, and phone; app-generated device IDs support request history and per-device throttling.
- Self-declared identity is **not verified** against university records. A malicious person can submit false details or rotate device IDs/IP addresses to evade limits; the hourly IP/device caps and field validation reduce but do not remove that abuse risk.
- Clipping files live on disk; database and API values contain relative paths, never localhost/LAN URLs. Public mobile reads use the same server content as the portal. SSE broadcasts public-module change metadata only, while the app refreshes on events, every 20 seconds, and when it resumes.
- `VITE_API_BASE_URL` supplies a build-time mobile default; the hidden in-app server setting can override it. A public tunnel URL still must be configured by the operator for off-campus mobile data.

## Notes

- Tunnel credentials (ngrok authtoken, Cloudflare token, Tailscale key) are user-provided in `.env` and not committed to the repo.
- The APK is a debug build. For Play Store release, a release keystore and signing config are needed (documented in README).

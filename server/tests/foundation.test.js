import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { applyMigrations, openDatabase } from '../src/db/database.js';
import { MODULES, seedDatabase } from '../src/db/seed.js';

const initialPassword = 'Initial-Library-Pass-2026!';
const updatedPassword = 'Changed-Library-Pass-2026!';

async function createTestServer({ authDisabled = false, seedAdmin = true } = {}) {
  const database = openDatabase(':memory:');
  applyMigrations(database);
  seedDatabase(database, seedAdmin ? { email: 'admin@example.edu', password: initialPassword } : {});
  const config = {
    environment: 'test',
    authDisabled,
    jwtSecret: 'test-only-signing-secret-that-is-at-least-thirty-two-characters',
    accessTokenTtl: '15m',
    refreshTokenDays: 30,
    allowedEmailDomains: ['example.edu'],
    corsOrigins: ['http://localhost:5173'],
    version: 'test',
    googleClientId: 'test-google-client-id.apps.googleusercontent.com',
  };
  const server = createApp({ database, config }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  return {
    database,
    baseUrl,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      database.close();
    },
  };
}

async function request(baseUrl, route, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

function permissionMatrix(allowed = []) {
  return MODULES.flatMap(module => ['read', 'write', 'update', 'delete'].map(action => ({
    module,
    action,
    allowed: allowed.includes(`${module}:${action}`),
  })));
}

async function loginAsSuperAdmin(baseUrl) {
  const login = await request(baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.edu', password: initialPassword },
  });
  const changed = await request(baseUrl, '/auth/change-password', {
    method: 'POST',
    token: login.body.data.accessToken,
    body: { currentPassword: initialPassword, newPassword: updatedPassword },
  });
  return changed.body.data.accessToken;
}

test('health endpoint reports a versioned success envelope', async t => {
  const context = await createTestServer();
  t.after(() => context.close());

  const result = await request(context.baseUrl, '/health');
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.data.status, 'ok');
  assert.equal(result.body.data.version, 'test');

  const portal = await fetch(context.baseUrl.replace('/api/v1', '/'));
  assert.equal(portal.status, 200);
  assert.match(await portal.text(), /NU LIRC \| Staff Portal/);
});

test('refresh token rotation invalidates the old access and refresh tokens', async t => {
  const context = await createTestServer();
  t.after(() => context.close());

  const login = await request(context.baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.edu', password: initialPassword },
  });
  const rotated = await request(context.baseUrl, '/auth/refresh', {
    method: 'POST',
    body: { refreshToken: login.body.data.refreshToken },
  });
  assert.equal(rotated.status, 200);

  const oldAccess = await request(context.baseUrl, '/auth/me', { token: login.body.data.accessToken });
  assert.equal(oldAccess.status, 401);
  const replay = await request(context.baseUrl, '/auth/refresh', {
    method: 'POST',
    body: { refreshToken: login.body.data.refreshToken },
  });
  assert.equal(replay.status, 401);

  const currentAccess = await request(context.baseUrl, '/auth/me', { token: rotated.body.data.accessToken });
  assert.equal(currentAccess.status, 200);
});

test('local development mode bypasses login and permissions without a seeded user', async t => {
  const context = await createTestServer({ authDisabled: true, seedAdmin: false });
  t.after(() => context.close());

  const currentUser = await request(context.baseUrl, '/auth/me');
  assert.equal(currentUser.status, 200);
  assert.equal(currentUser.body.data.user.email, 'local@localhost');
  assert.equal(currentUser.body.data.user.roleKey, 'local_development');

  const auditLog = await request(context.baseUrl, '/audit-log');
  assert.equal(auditLog.status, 200);
});

test('initial password change rotates tokens and logout revokes immediately', async t => {
  const context = await createTestServer();
  t.after(() => context.close());

  const deniedDomain = await request(context.baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: 'user@outside.test', password: initialPassword },
  });
  assert.equal(deniedDomain.status, 403);
  assert.equal(deniedDomain.body.error.code, 'EMAIL_DOMAIN_NOT_ALLOWED');

  const login = await request(context.baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.edu', password: initialPassword },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.data.user.mustChangePassword, true);

  const blockedAudit = await request(context.baseUrl, '/audit-log', { token: login.body.data.accessToken });
  assert.equal(blockedAudit.status, 403);
  assert.equal(blockedAudit.body.error.code, 'PASSWORD_CHANGE_REQUIRED');

  const changed = await request(context.baseUrl, '/auth/change-password', {
    method: 'POST',
    token: login.body.data.accessToken,
    body: { currentPassword: initialPassword, newPassword: updatedPassword },
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.data.user.mustChangePassword, false);

  const oldSession = await request(context.baseUrl, '/auth/me', { token: login.body.data.accessToken });
  assert.equal(oldSession.status, 401);
  assert.equal(oldSession.body.error.code, 'SESSION_REVOKED');

  const currentUser = await request(context.baseUrl, '/auth/me', { token: changed.body.data.accessToken });
  assert.equal(currentUser.status, 200);
  assert.equal(currentUser.body.data.user.email, 'admin@example.edu');

  const oldRefresh = await request(context.baseUrl, '/auth/refresh', {
    method: 'POST',
    body: { refreshToken: login.body.data.refreshToken },
  });
  assert.equal(oldRefresh.status, 401);

  const logout = await request(context.baseUrl, '/auth/logout', { method: 'POST', token: changed.body.data.accessToken });
  assert.equal(logout.status, 200);
  const afterLogout = await request(context.baseUrl, '/auth/me', { token: changed.body.data.accessToken });
  assert.equal(afterLogout.status, 401);

  assert.throws(() => context.database.prepare("UPDATE audit_log SET summary = 'tampered' WHERE id = 1").run(), /immutable/);
  assert.throws(() => context.database.prepare('DELETE FROM audit_log WHERE id = 1').run(), /immutable/);
});

test('audit read access is checked against current database permissions', async t => {
  const context = await createTestServer();
  t.after(() => context.close());

  const noCredentials = await request(context.baseUrl, '/audit-log');
  assert.equal(noCredentials.status, 401);

  const login = await request(context.baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.edu', password: initialPassword },
  });
  const changed = await request(context.baseUrl, '/auth/change-password', {
    method: 'POST',
    token: login.body.data.accessToken,
    body: { currentPassword: initialPassword, newPassword: updatedPassword },
  });
  const user = context.database.prepare("SELECT role_id FROM users WHERE email = 'admin@example.edu'").get();
  context.database.prepare("UPDATE role_permissions SET allowed = 0 WHERE role_id = ? AND module = 'audit_log' AND action = 'read'").run(user.role_id);

  const denied = await request(context.baseUrl, '/audit-log', { token: changed.body.data.accessToken });
  assert.equal(denied.status, 403);
  assert.equal(denied.body.error.code, 'PERMISSION_DENIED');

  context.database.prepare("UPDATE role_permissions SET allowed = 1 WHERE role_id = ? AND module = 'audit_log' AND action = 'read'").run(user.role_id);
  const allowed = await request(context.baseUrl, '/audit-log?page=1&pageSize=10', { token: changed.body.data.accessToken });
  assert.equal(allowed.status, 200);
  assert.ok(allowed.body.data.pagination.total >= 2);
});

test('default roles start with least-privilege permissions', async t => {
  const context = await createTestServer();
  t.after(() => context.close());

  const permission = (roleKey, module, action) => context.database.prepare(`
    SELECT role_permissions.allowed FROM role_permissions
    JOIN roles ON roles.id = role_permissions.role_id
    WHERE roles.system_key = ? AND role_permissions.module = ? AND role_permissions.action = ?
  `).get(roleKey, module, action)?.allowed || 0;

  assert.equal(permission('staff', 'books', 'write'), 1);
  assert.equal(permission('staff', 'roles', 'read'), 0);
  assert.equal(permission('staff', 'user_management', 'read'), 0);
  assert.equal(permission('student', 'book_requests', 'write'), 1);
  assert.equal(permission('student', 'books', 'delete'), 0);
});

test('Super Admin creates roles and staff, and suspension revokes the staff session', async t => {
  const context = await createTestServer();
  t.after(() => context.close());
  const adminToken = await loginAsSuperAdmin(context.baseUrl);

  const protectedLastAdmin = await request(context.baseUrl, '/admin/users/usr_admin', {
    method: 'DELETE',
    token: adminToken,
  });
  assert.notEqual(protectedLastAdmin.status, 200);

  const librarian = await request(context.baseUrl, '/admin/roles', {
    method: 'POST',
    token: adminToken,
    body: {
      name: 'Librarian Test',
      permissions: permissionMatrix(['books:read', 'books:write', 'books:update']),
    },
  });
  assert.equal(librarian.status, 201);
  const deletePermission = librarian.body.data.permissions.find(item => item.module === 'books' && item.action === 'delete');
  assert.equal(deletePermission.allowed, false);

  const created = await request(context.baseUrl, '/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { email: 'librarian@example.edu', name: 'Test Librarian', roleId: librarian.body.data.id },
  });
  assert.equal(created.status, 201);
  assert.ok(created.body.data.temporaryPassword.length >= 12);
  assert.equal(created.body.data.user.mustChangePassword, true);

  const outOfDomain = await request(context.baseUrl, '/admin/users', {
    method: 'POST',
    token: adminToken,
    body: { email: 'librarian@outside.test', name: 'Outside User', roleId: librarian.body.data.id },
  });
  assert.equal(outOfDomain.status, 403);

  const staffLogin = await request(context.baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: 'librarian@example.edu', password: created.body.data.temporaryPassword },
  });
  assert.equal(staffLogin.status, 200);
  const changedStaffPassword = await request(context.baseUrl, '/auth/change-password', {
    method: 'POST',
    token: staffLogin.body.data.accessToken,
    body: { currentPassword: created.body.data.temporaryPassword, newPassword: 'Librarian-Changed-2026!' },
  });
  assert.equal(changedStaffPassword.status, 200);

  const staffDeleteDenied = await request(context.baseUrl, '/admin/users', { token: changedStaffPassword.body.data.accessToken });
  assert.equal(staffDeleteDenied.status, 403);

  const staffBook = await request(context.baseUrl, '/books', {
    method: 'POST',
    token: changedStaffPassword.body.data.accessToken,
    body: { title: 'Role Permission Check', author: 'Test Author', quantityTotal: 1, quantityAvailable: 1 },
  });
  assert.equal(staffBook.status, 201);
  const forbiddenDelete = await request(context.baseUrl, `/books/${staffBook.body.data.id}`, {
    method: 'DELETE',
    token: changedStaffPassword.body.data.accessToken,
  });
  assert.equal(forbiddenDelete.status, 403);
  assert.equal(forbiddenDelete.body.error.code, 'PERMISSION_DENIED');

  const suspended = await request(context.baseUrl, `/admin/users/${created.body.data.user.id}`, {
    method: 'PUT',
    token: adminToken,
    body: { isActive: false },
  });
  assert.equal(suspended.status, 200);
  const revokedSession = await request(context.baseUrl, '/auth/me', { token: changedStaffPassword.body.data.accessToken });
  assert.equal(revokedSession.status, 401);
});

test('content endpoints manage catalog, library information, holidays, resources, and announcements', async t => {
  const context = await createTestServer({ authDisabled: true, seedAdmin: false });
  t.after(() => context.close());

  const category = await request(context.baseUrl, '/books/categories', {
    method: 'POST', body: { name: 'Test Category' },
  });
  assert.equal(category.status, 201);

  const book = await request(context.baseUrl, '/books', {
    method: 'POST',
    body: {
      title: 'Library API Verification', author: 'Test Author', isbn: 'TEST-9780000000001',
      categoryId: category.body.data.id, shelfLocation: 'Test shelf', quantityTotal: 4, quantityAvailable: 3,
    },
  });
  assert.equal(book.status, 201);
  const found = await request(context.baseUrl, '/books?query=verification');
  assert.equal(found.body.data.pagination.total, 1);
  assert.equal(found.body.data.items[0].id, book.body.data.id);

  const duplicate = await request(context.baseUrl, '/books', {
    method: 'POST',
    body: { title: 'Library API Verification', author: 'Test Author', isbn: 'TEST-9780000000001', quantityTotal: 1, quantityAvailable: 1 },
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, 'DUPLICATE_BOOK');

  const staleUpdate = await request(context.baseUrl, `/books/${book.body.data.id}`, {
    method: 'PUT',
    body: {
      title: 'Changed title', author: 'Test Author', isbn: 'TEST-9780000000001',
      quantityTotal: 4, quantityAvailable: 3, version: 99,
    },
  });
  assert.equal(staleUpdate.status, 409);
  assert.equal(staleUpdate.body.error.code, 'VERSION_CONFLICT');

  const csvImport = await fetch(`${context.baseUrl}/books/import.csv`, {
    method: 'POST',
    headers: { 'content-type': 'text/csv' },
    body: 'title,author,isbn,quantityTotal,quantityAvailable\nCSV Imported Book,CSV Author,CSV-9780000000002,2,2',
  });
  assert.equal(csvImport.status, 200);
  assert.equal((await csvImport.json()).data.imported, 1);
  const csvExport = await fetch(`${context.baseUrl}/books/export.csv`);
  assert.equal(csvExport.status, 200);
  assert.match(await csvExport.text(), /CSV Imported Book/);

  const info = await request(context.baseUrl, '/general-info');
  assert.equal(info.body.data.version, 0);
  const updatedInfo = await request(context.baseUrl, '/general-info', {
    method: 'PUT',
    body: { rulesMarkdown: 'Updated through API', timings: [], contact: { email: 'library@example.edu' }, version: 0 },
  });
  assert.equal(updatedInfo.status, 200);
  assert.equal(updatedInfo.body.data.version, 1);

  const holiday = await request(context.baseUrl, '/holidays', {
    method: 'POST',
    body: { date: '2027-01-01', name: 'Test Holiday', isClosed: true },
  });
  assert.equal(holiday.status, 201);
  const holidayList = await request(context.baseUrl, '/holidays?from=2027-01-01');
  assert.equal(holidayList.body.data.items.length, 1);

  const resourceCategory = await request(context.baseUrl, '/e-resources/categories', {
    method: 'POST', body: { name: 'Test Resources' },
  });
  assert.equal(resourceCategory.status, 201);
  const resource = await request(context.baseUrl, '/e-resources', {
    method: 'POST',
    body: { title: 'Test Resource', url: 'https://example.edu/resource', categoryId: resourceCategory.body.data.id, requiresCampusNetwork: true },
  });
  assert.equal(resource.status, 201);
  const resources = await request(context.baseUrl, '/e-resources');
  assert.equal(resources.body.data.items.length, 1);
  assert.equal(resources.body.data.items[0].requiresCampusNetwork, true);

  const announcement = await request(context.baseUrl, '/announcements', {
    method: 'POST', body: { title: 'Test notice', body: 'API-only test notice', isPublished: true },
  });
  assert.equal(announcement.status, 201);
  const announcements = await request(context.baseUrl, '/announcements');
  assert.equal(announcements.body.data.items[0].id, announcement.body.data.id);
});

test('clippings require valid file signatures and serve uploaded files', async t => {
  const context = await createTestServer({ authDisabled: true, seedAdmin: false });
  t.after(async () => {
    const rows = context.database.prepare('SELECT stored_name FROM clipping_files').all();
    const { removeUploadedFile } = await import('../src/uploads.js');
    rows.forEach(row => removeUploadedFile(row.stored_name));
    await context.close();
  });

  const invalidForm = new FormData();
  invalidForm.set('date', '2026-10-09');
  invalidForm.set('topic', 'Test topic');
  invalidForm.set('newspaperName', 'Test paper');
  invalidForm.append('files', new Blob(['not a real png'], { type: 'image/png' }), 'fake.png');
  const invalid = await fetch(`${context.baseUrl}/clippings`, { method: 'POST', body: invalidForm });
  assert.equal(invalid.status, 415);

  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const validForm = new FormData();
  validForm.set('title', 'Test clipping');
  validForm.set('date', '2026-10-09');
  validForm.set('topic', 'Test topic');
  validForm.set('newspaperName', 'Test paper');
  validForm.append('files', new Blob([pngHeader], { type: 'image/png' }), 'test.png');
  const created = await fetch(`${context.baseUrl}/clippings`, { method: 'POST', body: validForm });
  assert.equal(created.status, 201);
  const clipping = (await created.json()).data;
  assert.equal(clipping.files.length, 1);
  const clippingList = await request(context.baseUrl, '/clippings?page=1&pageSize=10');
  assert.equal(clippingList.status, 200);
  assert.equal(clippingList.body.data.pagination.total, 1);
  const fileResponse = await fetch(`http://127.0.0.1:${new URL(context.baseUrl).port}${clipping.files[0].url}`);
  assert.equal(fileResponse.status, 200);
  const deleted = await request(context.baseUrl, `/clippings/${clipping.id}`, { method: 'DELETE' });
  assert.equal(deleted.status, 200);
});

test('discussion rooms, room requests, conflict detection and overrides', async t => {
  const context = await createTestServer({ authDisabled: true, seedAdmin: false });
  t.after(async () => { await context.close(); });

  const roomRes = await request(context.baseUrl, '/rooms', {
    method: 'POST',
    body: { name: 'Conference Pod 1', capacity: 8, isActive: true },
  });
  assert.equal(roomRes.status, 201);
  const room = roomRes.body.data;
  assert.equal(room.capacity, 8);

  // Group size exceeding capacity rejected
  const overCapacity = await fetch(`${context.baseUrl}/room-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'test-idem-key-001' },
    body: JSON.stringify({
      roomId: room.id,
      date: '2026-10-15',
      startTime: '10:00',
      endTime: '12:00',
      purpose: 'Team study',
      groupSize: 10,
      studentName: 'Alice Student',
      studentEmail: 'alice@example.edu',
    }),
  });
  assert.equal(overCapacity.status, 400);

  // Valid request with idempotency key
  const req1Res = await fetch(`${context.baseUrl}/room-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'test-idem-key-001' },
    body: JSON.stringify({
      roomId: room.id,
      date: '2026-10-15',
      startTime: '10:00',
      endTime: '12:00',
      purpose: 'Algorithms study',
      groupSize: 4,
      studentName: 'Alice Student',
      studentEmail: 'alice@example.edu',
    }),
  });
  assert.equal(req1Res.status, 201);
  const req1 = (await req1Res.json()).data;
  assert.equal(req1.status, 'pending');

  // Duplicate submission with same idempotency key returns 200 duplicate
  const dupRes = await fetch(`${context.baseUrl}/room-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'test-idem-key-001' },
    body: JSON.stringify({
      roomId: room.id,
      date: '2026-10-15',
      startTime: '10:00',
      endTime: '12:00',
      purpose: 'Algorithms study',
      groupSize: 4,
      studentName: 'Alice Student',
      studentEmail: 'alice@example.edu',
    }),
  });
  assert.equal(dupRes.status, 200);
  assert.equal((await dupRes.json()).data.duplicateSubmission, true);

  // Approve req1
  const approve1 = await request(context.baseUrl, `/room-requests/${req1.id}/decision`, {
    method: 'PATCH',
    body: { status: 'approved', remarks: 'Key at desk', version: req1.version },
  });
  assert.equal(approve1.status, 200);
  assert.equal(approve1.body.data.status, 'approved');

  // Req2 by Bob that overlaps (11:00 to 13:00 overlaps 10:00 to 12:00)
  const req2Res = await fetch(`${context.baseUrl}/room-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'test-idem-key-002' },
    body: JSON.stringify({
      roomId: room.id,
      date: '2026-10-15',
      startTime: '11:00',
      endTime: '13:00',
      purpose: 'Robotics project',
      groupSize: 5,
      studentName: 'Bob Student',
      studentEmail: 'bob@example.edu',
    }),
  });
  assert.equal(req2Res.status, 201);
  const req2 = (await req2Res.json()).data;

  // List room requests verifies conflict flagged
  const listReqs = await request(context.baseUrl, '/room-requests?status=pending');
  assert.equal(listReqs.status, 200);
  const foundReq2 = listReqs.body.data.items.find(i => i.id === req2.id);
  assert.ok(foundReq2.conflicts.length > 0);
  assert.equal(foundReq2.conflicts[0].studentName, 'Alice Student');

  // Approving req2 WITHOUT overrideReason must be blocked (409 ROOM_CONFLICT)
  const blockedApproval = await request(context.baseUrl, `/room-requests/${req2.id}/decision`, {
    method: 'PATCH',
    body: { status: 'approved', version: req2.version },
  });
  assert.equal(blockedApproval.status, 409);
  assert.equal(blockedApproval.body.error.code, 'ROOM_CONFLICT');

  // Approving req2 WITH overrideReason succeeds
  const overriddenApproval = await request(context.baseUrl, `/room-requests/${req2.id}/decision`, {
    method: 'PATCH',
    body: { status: 'approved', overrideReason: 'Approved by Dean for urgent demo', version: req2.version },
  });
  assert.equal(overriddenApproval.status, 200);
  assert.equal(overriddenApproval.body.data.status, 'approved');
  assert.equal(overriddenApproval.body.data.overrideReason, 'Approved by Dean for urgent demo');

  // Availability endpoint shows both approved slots
  const avail = await request(context.baseUrl, `/rooms/availability?roomId=${room.id}&date=2026-10-15`);
  assert.equal(avail.status, 200);
  assert.equal(avail.body.data.bookings.length, 2);

  // Student cancels their booking
  const cancelRes = await request(context.baseUrl, `/room-requests/${req2.id}/cancel`, { method: 'PATCH' });
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.body.data.status, 'cancelled');

  // CSV export returns CSV
  const csvRes = await fetch(`${context.baseUrl}/room-requests/export.csv`);
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('Alice Student'));
});

test('book requests lifecycle with idempotency and catalog quantity tracking', async t => {
  const context = await createTestServer({ authDisabled: true, seedAdmin: false });
  t.after(async () => { await context.close(); });

  // Create a catalog book with 1 copy available
  const catBook = await request(context.baseUrl, '/books', {
    method: 'POST',
    body: {
      title: 'Database Internals',
      author: 'Alex Petrov',
      quantityTotal: 1,
      quantityAvailable: 1,
    },
  });
  assert.equal(catBook.status, 201);
  const bookId = catBook.body.data.id;

  // Student 1 requests this book
  const req1 = await fetch(`${context.baseUrl}/book-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'book-idem-001' },
    body: JSON.stringify({
      title: 'Database Internals',
      author: 'Alex Petrov',
      reason: 'Needed for distributed systems coursework',
      catalogBookId: bookId,
      studentName: 'Charlie Student',
      studentEmail: 'charlie@example.edu',
    }),
  });
  assert.equal(req1.status, 201);
  const bookReq1 = (await req1.json()).data;

  // Manager fulfills request 1
  const fulfill1 = await request(context.baseUrl, `/book-requests/${bookReq1.id}/decision`, {
    method: 'PATCH',
    body: { status: 'done', remarks: 'Reserved for Charlie', version: bookReq1.version },
  });
  assert.equal(fulfill1.status, 200);
  assert.equal(fulfill1.body.data.status, 'done');

  // Verify book quantity available is now 0
  const updatedBook = await request(context.baseUrl, `/books/${bookId}`);
  assert.equal(updatedBook.body.data.quantityAvailable, 0);

  // Student 2 requests the same catalog book
  const req2 = await fetch(`${context.baseUrl}/book-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'book-idem-002' },
    body: JSON.stringify({
      title: 'Database Internals',
      reason: 'Course study',
      catalogBookId: bookId,
      studentName: 'Dana Student',
      studentEmail: 'dana@example.edu',
    }),
  });
  assert.equal(req2.status, 201);
  const bookReq2 = (await req2.json()).data;

  // Attempting to fulfill req2 fails with BOOK_UNAVAILABLE (409)
  const failedFulfill = await request(context.baseUrl, `/book-requests/${bookReq2.id}/decision`, {
    method: 'PATCH',
    body: { status: 'done', version: bookReq2.version },
  });
  assert.equal(failedFulfill.status, 409);
  assert.equal(failedFulfill.body.error.code, 'BOOK_UNAVAILABLE');

  // Manager rejects req2
  const reject2 = await request(context.baseUrl, `/book-requests/${bookReq2.id}/decision`, {
    method: 'PATCH',
    body: { status: 'rejected', remarks: 'All copies in use', version: bookReq2.version },
  });
  assert.equal(reject2.status, 200);
  assert.equal(reject2.body.data.status, 'rejected');

  // CSV export
  const csvRes = await fetch(`${context.baseUrl}/book-requests/export.csv`);
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('Database Internals'));
});

test('realtime stream, delta sync, dashboard statistics, and audit csv export', async t => {
  const context = await createTestServer({ authDisabled: true, seedAdmin: false });
  t.after(async () => { await context.close(); });

  // 1. Dashboard stats returns baseline values
  const statsRes = await request(context.baseUrl, '/dashboard/stats');
  assert.equal(statsRes.status, 200);
  assert.equal(statsRes.body.data.inventory.totalBooks, 0);
  assert.equal(Array.isArray(statsRes.body.data.weeklyActivity), true);

  // 2. SSE Stream endpoint connects and receives connected event
  const streamRes = await fetch(`${context.baseUrl}/updates/stream`);
  assert.equal(streamRes.status, 200);
  assert.equal(streamRes.headers.get('content-type'), 'text/event-stream');

  const reader = streamRes.body.getReader();
  const firstChunk = await reader.read();
  const chunkText = new TextDecoder().decode(firstChunk.value);
  assert.ok(chunkText.includes('connected'));
  reader.cancel();

  // 3. Create a book to trigger an audit row and change event
  const bookRes = await request(context.baseUrl, '/books', {
    method: 'POST',
    body: { title: 'Clean Architecture', author: 'Robert Martin', quantityTotal: 2, quantityAvailable: 2 },
  });
  assert.equal(bookRes.status, 201);

  // 4. Delta sync endpoint returns the change
  const syncRes = await request(context.baseUrl, `/sync?since=${encodeURIComponent(new Date(Date.now() - 60000).toISOString())}`);
  assert.equal(syncRes.status, 200);
  assert.ok(syncRes.body.data.affectedModules.includes('books'));
  assert.ok(syncRes.body.data.changes.length > 0);

  // 5. Updated dashboard stats reflect the book and recent activity
  const updatedStats = await request(context.baseUrl, '/dashboard/stats');
  assert.equal(updatedStats.body.data.inventory.totalBooks, 1);
  assert.equal(updatedStats.body.data.inventory.totalCopies, 2);
  assert.equal(updatedStats.body.data.recentActivity[0].summary, "Added book 'Clean Architecture'.");

  // 6. Audit log CSV export
  const auditCsv = await fetch(`${context.baseUrl}/audit-log/export.csv`);
  assert.equal(auditCsv.status, 200);
  const csvContent = await auditCsv.text();
  assert.ok(csvContent.includes('Clean Architecture'));
});
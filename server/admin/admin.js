const state = {
  token: sessionStorage.getItem('nuLircAdminToken') || '',
  refreshToken: sessionStorage.getItem('nuLircAdminRefreshToken') || '',
  user: null,
  permissions: [],
  modules: [],
  actions: [],
  roles: [],
  activeView: 'users',
  selectedRoleId: '',
  selectedRole: null,
  users: [],
  search: '',
  bookSearch: '',
  bookPage: 1,
  bookPageSize: 100,
  bookCategory: '',
  resourceCategories: [],
  editingResourceId: '',
  editingAnnouncementId: '',
  toastTimer: 0,
  roomFilter: '',
  roomStatusFilter: '',
  roomDateFilter: '',
  roomSearch: '',
  rooms: [],
  selectedTimelineRoomId: '',
  selectedTimelineDate: new Date().toISOString().slice(0, 10),
  bookRequestStatusFilter: '',
  bookRequestSearch: '',
  auditModuleFilter: '',
  auditActionFilter: '',
  auditPage: 1,
  sseSource: null,
  sseStatus: 'disconnected',
  notifications: [],
  notificationSeenIds: new Set(),
  notificationOwner: '',
  notificationPollTimer: null,
  notificationToastTimer: null,
  notificationsInitialized: false,
};

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
let adminRefreshPromise = null;
const moduleNames = {
  dashboard: 'Dashboard',
  books: 'Books',
  new_arrivals: 'New arrivals',
  clippings: 'Newspaper clippings',
  general_info: 'General information',
  e_resources: 'e-Resources',
  discussion_rooms: 'Discussion rooms',
  book_requests: 'Book requests',
  feedback: 'Feedback',
  audit_log: 'Audit log',
  user_management: 'User management',
  roles: 'Roles',
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = `toast visible${isError ? ' error' : ''}`;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}

async function api(path, options = {}) {
  const requestOptions = () => ({
    ...options,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(state.token ? { authorization: `Bearer ${state.token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let response = await fetch(`/api/v1${path}`, requestOptions());
  if (response.status === 401 && state.token && state.refreshToken && path !== '/auth/refresh') {
    const refreshed = await refreshAdminSession();
    if (refreshed) response = await fetch(`/api/v1${path}`, requestOptions());
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    if (response.status === 401) {
      state.token = '';
      state.refreshToken = '';
      state.user = null;
      sessionStorage.removeItem('nuLircAdminToken');
      sessionStorage.removeItem('nuLircAdminRefreshToken');
      if (path !== '/auth/login') renderLogin('Your session ended. Please sign in again.');
    }
    let message = result?.error?.message || `Request failed (${response.status}).`;
    if (result?.error?.code === 'VALIDATION_ERROR' && Array.isArray(result.error.details)) {
      const fieldNames = { loginId: 'Login ID', name: 'Full name', roleId: 'Role', password: 'Password', isActive: 'Account status', permissions: 'Permissions' };
      const issues = result.error.details.map(issue => {
        const field = fieldNames[issue.field] || issue.field || 'Input';
        if (issue.field === 'loginId') return `${field} must be 3–120 characters and use only letters, numbers, ., _, @, +, or - (no spaces).`;
        if (issue.field === 'password') return `${field} must contain at least 12 characters.`;
        if (issue.field === 'roleId') return `${field}: select a valid role.`;
        return `${field}: ${issue.message}`;
      });
      if (issues.length) message = issues.join(' ');
    }
    const error = new Error(message);
    error.code = result?.error?.code;
    throw error;
  }
  return result.data;
}

function addAppSyncButton(content, module) {
  if (!['books', 'new_arrivals', 'clippings', 'general_info', 'e_resources', 'discussion_rooms', 'book_requests'].includes(module)) return;
  if (!['write', 'update', 'delete'].some(action => can(module, action))) return;
  const sectionHead = content.querySelector('.section-head');
  if (!sectionHead) return;
  let toolbar = sectionHead.querySelector(':scope > .toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    sectionHead.append(toolbar);
  }
  const button = document.createElement('button');
  button.className = 'button button-quiet';
  button.type = 'button';
  button.textContent = 'Sync with app';
  button.title = 'Ask connected student apps to refresh this content now';
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await api('/sync/publish', { method: 'POST', body: { modules: [module] } });
      showToast('App sync requested. Connected student apps will refresh now.');
    } catch (error) {
      showToast(error.message || 'Could not sync with the app.', true);
    } finally {
      button.disabled = false;
    }
  });
  toolbar.append(button);
}

async function refreshAdminSession() {
  if (adminRefreshPromise) return adminRefreshPromise;
  adminRefreshPromise = (async () => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.data?.accessToken || !result.data?.refreshToken) return false;
      state.token = result.data.accessToken;
      state.refreshToken = result.data.refreshToken;
      sessionStorage.setItem('nuLircAdminToken', state.token);
      sessionStorage.setItem('nuLircAdminRefreshToken', state.refreshToken);
      return true;
    } catch { return false; }
    finally { adminRefreshPromise = null; }
  })();
  return adminRefreshPromise;
}

function renderLogin(message = '') {
  app.innerHTML = `
    <div class="login-shell">
      <aside class="login-aside">
        <div class="brand"><div class="brand-mark">NU</div><div><p class="brand-title">NIIT UNIVERSITY</p><p class="brand-subtitle">Learning & Information Resource Centre</p></div></div>
        <div><p class="eyebrow" style="color:#d9ed86">STAFF CONSOLE / 01</p><h1>Library operations, in one place.</h1><p>Manage staff access and role permissions for the NU LIRC system.</p></div>
        <p>NU LIRC · Administration</p>
      </aside>
      <section class="login-main">
        <form class="login-form" id="login-form">
          <p class="eyebrow">SECURE STAFF ACCESS</p>
          <h2>Sign in</h2>
          <p>Use your university staff account.</p>
          ${message ? `<div class="notice error">${escapeHtml(message)}</div>` : ''}
          <div class="field"><label for="login-id">Login ID</label><input class="input" id="login-id" type="text" autocomplete="username" required /></div>
          <div class="field"><label for="login-password">Password</label><input class="input" id="login-password" type="password" autocomplete="current-password" required /></div>
          <button class="button button-primary" type="submit">Continue</button>
        </form>
      </section>
    </div>`;
  document.querySelector('#login-form').addEventListener('submit', handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const loginId = document.querySelector('#login-id').value;
  const password = document.querySelector('#login-password').value;
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Signing in...';
  try {
    const result = await api('/auth/login', { method: 'POST', body: { loginId, password } });
    state.token = result.accessToken;
    state.refreshToken = result.refreshToken;
    sessionStorage.setItem('nuLircAdminToken', state.token);
    sessionStorage.setItem('nuLircAdminRefreshToken', state.refreshToken);
    // Do not carry an old user's forbidden route (for example /roles) into
    // this session. A successful login should choose this role's own home page.
    history.replaceState({}, '', '/login');
    await loadUser();
  } catch (error) {
    renderLogin(error.message);
  } finally {
    form.delete('email');
    submit.disabled = false;
  }
}

async function loadUser() {
  try {
    const result = await api('/auth/me');
    state.user = result.user;
    const isSuperAdmin = state.user.roleKey === 'super_admin';
    state.permissions = isSuperAdmin
      ? (result.permissions || []).filter(permission => ['user_management', 'roles'].includes(permission.module))
      : (result.permissions || []);
    if (state.user.mustChangePassword) {
      renderChangePassword();
      return;
    }
    const moduleCatalog = isSuperAdmin ? await api('/admin/modules') : null;
    state.modules = moduleCatalog?.modules || [...new Set((result.permissions || []).map(permission => permission.module))];
    state.actions = moduleCatalog?.actions || ['read', 'write', 'update', 'delete'];
    const firstModule = ['dashboard', 'books', 'new_arrivals', 'clippings', 'general_info', 'e_resources', 'discussion_rooms', 'book_requests', 'audit_log']
      .find(module => can(module, 'read'));
    const moduleViews = { dashboard: 'dashboard', books: 'books', new_arrivals: 'new_arrivals', clippings: 'clippings', general_info: 'general', e_resources: 'resources', discussion_rooms: 'rooms', book_requests: 'book_requests', audit_log: 'audit' };
    const firstView = isSuperAdmin ? 'users' : moduleViews[firstModule];
    const requestedView = viewForPath(window.location.pathname);
    if (requestedView && requestedView !== 'home' && !canOpenView(requestedView)) { renderForbidden(); return; }
    state.activeView = requestedView && requestedView !== 'home' ? requestedView : firstView;
    if (!state.activeView) {
      renderForbidden('No modules are available because this role has no Read permissions. Ask the Super Admin to grant Read access in Roles.');
      return;
    }
    history.replaceState({}, '', pathForView(state.activeView));
    window.onpopstate = () => {
      const target = viewForPath(window.location.pathname);
      if (!target || !canOpenView(target)) { renderForbidden(); return; }
      state.activeView = target;
      renderShell();
      loadView(target);
    };
    renderShell();
    await loadView(state.activeView);
  } catch (error) {
    if (state.token) renderLogin(error.message);
    else renderLogin();
  }
}

function renderChangePassword(allowCancel = false) {
  app.innerHTML = `
    <div class="login-shell">
      <aside class="login-aside"><div class="brand"><div class="brand-mark">NU</div><div><p class="brand-title">NIIT UNIVERSITY</p><p class="brand-subtitle">Learning & Information Resource Centre</p></div></div><div><p class="eyebrow" style="color:#d9ed86">${allowCancel ? 'ACCOUNT SETTINGS' : 'ACCOUNT SETUP'}</p><h1>${allowCancel ? 'Password & security.' : 'One last step.'}</h1><p>${allowCancel ? 'Update your account password.' : 'Change the temporary password before continuing.'}</p></div><p>NU LIRC · Administration</p></aside>
      <section class="login-main"><form class="login-form" id="password-form"><p class="eyebrow">${allowCancel ? 'SECURITY' : 'FIRST SIGN-IN'}</p><h2>${allowCancel ? 'Change password' : 'Set a new password'}</h2>
        <div class="field"><label for="current-password">${allowCancel ? 'Current password' : 'Temporary password'}</label><input class="input" id="current-password" type="password" autocomplete="current-password" required /></div>
        <div class="field"><label for="new-password">New password (12 characters minimum)</label><input class="input" id="new-password" type="password" minlength="12" autocomplete="new-password" required /></div>
        <div class="toolbar">${allowCancel ? '<button class="button button-quiet" type="button" id="cancel-password">Cancel</button>' : ''}<button class="button button-primary" type="submit">Change password</button></div></form></section></div>`;
  document.querySelector('#cancel-password')?.addEventListener('click', () => loadUser());
  document.querySelector('#password-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const currentPassword = document.querySelector('#current-password').value;
    const newPassword = document.querySelector('#new-password').value;
    try {
      const result = await api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
      state.token = result.accessToken;
      state.refreshToken = result.refreshToken;
      sessionStorage.setItem('nuLircAdminToken', state.token);
      sessionStorage.setItem('nuLircAdminRefreshToken', state.refreshToken);
      await loadUser();
    } catch (error) { showToast(error.message, true); }
    finally { form.reset(); }
  });
}

function showProfileDialog() {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title">
    <div class="dialog-head"><h2 id="profile-title">Your profile</h2><button class="button button-quiet button-small" data-close>Close</button></div>
    <div class="dialog-body profile-details">
      <div><span class="field-label">Full name</span><strong>${escapeHtml(state.user.name)}</strong></div>
      <div><span class="field-label">Login ID</span><strong>${escapeHtml(state.user.loginId || state.user.email)}</strong></div>
    </div>
  </section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.remove(); });
}

function showSettingsDialog() {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <div class="dialog-head"><h2 id="settings-title">Settings</h2><button class="button button-quiet button-small" data-close>Close</button></div>
    <div class="dialog-body"><div><strong>Account security</strong><p class="heading-note">Update the password used to sign in to the staff portal.</p></div></div>
    <div class="dialog-actions"><button class="button button-primary" id="open-password-settings">Change password</button></div>
  </section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('#open-password-settings').addEventListener('click', () => {
    backdrop.remove();
    renderChangePassword(true);
  });
}

const routeViews = {
  '/': 'home', '/login': 'home', '/dashboard': 'dashboard', '/books': 'books',
  '/activity-feed': 'activity_feed', '/new-arrivals': 'new_arrivals',
  '/clippings': 'clippings', '/general-info': 'general', '/e-resources': 'resources',
  '/discussion-rooms': 'rooms', '/book-requests': 'book_requests', '/audit-log': 'audit',
  '/users': 'users', '/roles': 'roles',
};
const viewPaths = Object.fromEntries(Object.entries(routeViews).filter(([path]) => path !== '/' && path !== '/login').map(([path, view]) => [view, path]));
const viewModules = { dashboard: 'dashboard', activity_feed: 'dashboard', books: 'books', new_arrivals: 'new_arrivals', clippings: 'clippings', general: 'general_info', announcements: 'general_info', resources: 'e_resources', rooms: 'discussion_rooms', book_requests: 'book_requests', audit: 'audit_log' };
function viewForPath(path) { return routeViews[path] || null; }
function pathForView(view) { return viewPaths[view] || (view === 'home' ? '/login' : '/'); }
function canOpenView(view) {
  if (state.user?.roleKey === 'super_admin') return ['users', 'roles'].includes(view);
  if (view === 'users' || view === 'roles' || view === 'home') return false;
  const module = viewModules[view];
  return Boolean(module && can(module, 'read'));
}

function renderForbidden(message = 'Your role does not have Read access to this module.') {
  app.innerHTML = `<main class="page"><div class="panel"><div class="panel-body"><p class="eyebrow">403 · ACCESS DENIED</p><h1>This page is not available to your role.</h1><p class="heading-note">${escapeHtml(message)}</p><button class="button button-quiet" id="signout">Sign out</button></div></div></main>`;
  document.querySelector('#signout').addEventListener('click', signOut);
}

function renderShell() {
  const isSuperAdmin = state.user.roleKey === 'super_admin';
  const isAccessAdministrator = ['super_admin', 'local_development'].includes(state.user.roleKey);
  const navigation = [
    ...(isAccessAdministrator ? [
      ['users', '01', 'Staff accounts'],
      ['roles', '02', 'Roles & permissions'],
    ] : []),
    ...(!isSuperAdmin && can('dashboard', 'read') ? [['dashboard', '00', 'Dashboard']] : []),
    ...(!isSuperAdmin && can('books', 'read') ? [['books', '01', 'Book inventory']] : []),
    ...(!isSuperAdmin && can('new_arrivals', 'read') ? [['new_arrivals', '02', 'New arrivals']] : []),
    ...(!isSuperAdmin && can('clippings', 'read') ? [['clippings', '02', 'Newspaper clippings']] : []),
    ...(!isSuperAdmin && can('general_info', 'read') ? [['general', '03', 'Library information']] : []),
    ...(!isSuperAdmin && can('e_resources', 'read') ? [['resources', '04', 'e-Resources']] : []),
    ...(!isSuperAdmin && can('general_info', 'read') ? [['announcements', '05', 'Announcements']] : []),
    ...(!isSuperAdmin && can('discussion_rooms', 'read') ? [['rooms', '06', 'Discussion rooms']] : []),
    ...(!isSuperAdmin && can('book_requests', 'read') ? [['book_requests', '07', 'Book requests']] : []),
    ...(!isSuperAdmin && can('audit_log', 'read') ? [['audit', '08', 'Audit log']] : []),
    ...(!isSuperAdmin && can('dashboard', 'read') ? [['activity_feed', '09', 'Recent Operations & Activity Feed']] : []),
  ];
  if (!navigation.some(([v]) => v === state.activeView) && navigation.length > 0) {
    state.activeView = navigation[0][0];
  }
  const displayNavigation = navigation.map(([view, _number, label], index) => [
    view,
    String(index + 1).padStart(2, '0'),
    label,
  ]);
  const localNotice = state.user.roleKey === 'local_development'
    ? '<p class="notice">Local development mode: authentication and permissions are bypassed. The API should be reachable only from this PC.</p>' : '';
  app.innerHTML = `
    <header class="masthead">
      <div class="brand"><div class="brand-mark">NU</div><div><p class="brand-title">NIIT UNIVERSITY</p><p class="brand-subtitle">Learning & Information Resource Centre</p></div></div>
      <div class="user-block">
        <div class="live-badge" id="live-indicator"><span class="live-dot"></span> <span id="live-text">Not connected</span></div>
        <div class="header-account-name">${escapeHtml(state.user.name)}</div>
        <div class="account-menu">
          <button class="account-menu-toggle" id="account-menu-toggle" type="button" aria-label="Open user menu" aria-haspopup="true" aria-expanded="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>
          </button>
          <div class="account-dropdown" id="account-dropdown" hidden>
            <button type="button" data-account-action="profile">Profile</button>
            <button type="button" data-account-action="settings">Settings</button>
            <button type="button" class="account-logout" id="signout">Log out</button>
          </div>
        </div>
        <div class="notification-menu">
          <button class="notification-toggle" id="notification-toggle" type="button" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            <span class="notification-count" id="notification-count" hidden></span>
          </button>
          <div class="notification-dropdown" id="notification-dropdown" hidden></div>
        </div>
      </div>
    </header>
    <div class="notification-toast" id="notification-toast" role="status" aria-live="polite" hidden></div>
    <main class="page">
      <div class="page-heading"><div><p class="eyebrow">NU LIRC / STAFF PORTAL</p><h1>${isSuperAdmin ? 'Access management' : 'Library management'}</h1><p class="heading-note">${isSuperAdmin ? 'Manage staff users and role permissions.' : 'Library modules available to you.'}</p></div></div>
      ${localNotice}
      <div class="layout">
        <nav class="side-nav" aria-label="Administration">
          ${displayNavigation.map(([view, number, label]) => `<button class="nav-button${state.activeView === view ? ' active' : ''}" data-view="${view}"><span class="nav-glyph">${number}</span> ${label}</button>`).join('')}
        </nav>
        <section class="content" id="view-content" aria-live="polite"><p class="loading">Loading...</p></section>
      </div>
    </main>`;
  document.querySelector('#signout').addEventListener('click', signOut);
  const accountToggle = document.querySelector('#account-menu-toggle');
  const accountDropdown = document.querySelector('#account-dropdown');
  accountToggle.addEventListener('click', () => {
    const open = accountDropdown.hidden;
    accountDropdown.hidden = !open;
    accountToggle.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('[data-account-action]').forEach(button => button.addEventListener('click', () => {
    accountDropdown.hidden = true;
    accountToggle.setAttribute('aria-expanded', 'false');
    if (button.dataset.accountAction === 'profile') showProfileDialog();
    else showSettingsDialog();
  }));
  const notificationToggle = document.querySelector('#notification-toggle');
  const notificationDropdown = document.querySelector('#notification-dropdown');
  notificationToggle.addEventListener('click', async () => {
    const open = notificationDropdown.hidden;
    notificationDropdown.hidden = !open;
    notificationToggle.setAttribute('aria-expanded', String(open));
    if (open) await refreshNotifications(false);
  });
  notificationDropdown.addEventListener('click', event => {
    const dismiss = event.target.closest('[data-dismiss-notification]');
    if (!dismiss) return;
    dismissNotification(dismiss.dataset.dismissNotification);
  });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', async () => {
    state.activeView = button.dataset.view;
    history.pushState({}, '', pathForView(state.activeView));
    document.querySelectorAll('[data-view]').forEach(nav => nav.classList.toggle('active', nav === button));
    await loadView(state.activeView);
  }));
  setupRealtimeEvents();
}

async function signOut() {
  if (state.sseSource) {
    try { state.sseSource.close(); } catch {}
    state.sseSource = null;
  }
  try { if (state.token) await api('/auth/logout', { method: 'POST' }); } catch { /* Local mode has no session token. */ }
  state.token = '';
  state.refreshToken = '';
  state.user = null;
  sessionStorage.removeItem('nuLircAdminToken');
  sessionStorage.removeItem('nuLircAdminRefreshToken');
  history.replaceState({}, '', '/login');
  renderLogin();
}

async function loadView(view) {
  const content = document.querySelector('#view-content');
  if (!content) return;
  if (!canOpenView(view)) { renderForbidden(); return; }
  content.innerHTML = '<p class="loading">Loading...</p>';
  try {
    if (view === 'dashboard') await loadDashboardView(content);
    else if (view === 'activity_feed') await loadActivityFeedView(content);
    else if (view === 'roles') await loadRolesView(content);
    else if (view === 'books') await loadBooksView(content);
    else if (view === 'new_arrivals') await loadNewArrivalsView(content);
    else if (view === 'clippings') await loadClippingsView(content);
    else if (view === 'general') await loadGeneralView(content);
    else if (view === 'resources') await loadResourcesView(content);
    else if (view === 'announcements') await loadAnnouncementsView(content);
    else if (view === 'rooms') await loadRoomsView(content);
    else if (view === 'book_requests') await loadBookRequestsView(content);
    else if (view === 'audit') await loadAuditView(content);
    else await loadUsersView(content);
  } catch (error) {
    content.innerHTML = `<div class="panel"><div class="empty">${escapeHtml(error.message)}</div></div>`;
  }
}

async function loadRolesView(content) {
  state.roles = await api('/admin/roles');
  const roleOptions = state.roles.map(role => `<option value="${escapeHtml(role.id)}">${escapeHtml(role.name)}</option>`).join('');
  content.innerHTML = `
    <div class="section-head"><div><h2>Roles & permissions</h2><p>Define the actions available in each part of the system.</p></div><button class="button button-primary" id="new-role">＋ New role</button></div>
    <div class="panel"><div class="panel-head"><h3>Role settings</h3><div class="toolbar"><select class="select" id="role-select" aria-label="Select a role">${roleOptions}</select><button class="button button-quiet button-small" id="clone-role">Clone</button></div></div>
      <div class="panel-body"><div class="toolbar" style="justify-content:space-between;margin-bottom:14px"><div class="field" style="flex:1"><label for="role-name">Role name</label><input class="input" id="role-name" maxlength="80" /></div><div class="toolbar" style="align-self:end"><button class="button button-danger button-small" id="delete-role">Delete role</button><button class="button button-primary" id="save-role">Save permissions</button></div></div>
      <p class="notice" id="role-compat-warning" hidden></p><div class="permissions" id="permission-table"><p class="loading">Loading permission matrix...</p></div></div>
    </div>
    <div class="panel"><div class="panel-head"><h3>Available roles</h3><span class="table-secondary">${state.roles.length} roles</span></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Assigned users</th></tr></thead><tbody>${state.roles.map(role => `<tr><td><span class="table-primary">${escapeHtml(role.name)}</span></td><td>${role.isSystem ? '<span class="status">System</span>' : '<span class="status">Custom</span>'}</td><td>${role.assignedUsers}</td></tr>`).join('')}</tbody></table></div></div>`;
  document.querySelector('#role-select').addEventListener('change', event => { state.selectedRoleId = event.target.value; loadRoleDetails(); });
  document.querySelector('#new-role').addEventListener('click', createRole);
  document.querySelector('#clone-role').addEventListener('click', cloneRole);
  document.querySelector('#save-role').addEventListener('click', saveRole);
  document.querySelector('#delete-role').addEventListener('click', deleteRole);
  state.selectedRoleId = state.roles[0]?.id || '';
  if (state.selectedRoleId) await loadRoleDetails();
}

async function loadRoleDetails() {
  const role = await api(`/admin/roles/${encodeURIComponent(state.selectedRoleId)}`);
  state.selectedRole = role;
  const nameInput = document.querySelector('#role-name');
  if (!nameInput) return;
  nameInput.value = role.name;
  nameInput.disabled = role.isSystem;
  document.querySelector('#delete-role').disabled = role.isSystem;
  const unsupportedModules = [...new Set(role.permissions.filter(item => !state.modules.includes(item.module)).map(item => item.module))];
  const compatibilityWarning = document.querySelector('#role-compat-warning');
  compatibilityWarning.hidden = unsupportedModules.length === 0;
  compatibilityWarning.textContent = unsupportedModules.length
    ? `This server is out of date and cannot edit permissions for: ${unsupportedModules.join(', ')}. Restart the server to load the current permission modules.`
    : '';
  document.querySelector('#save-role').disabled = role.isSystem || unsupportedModules.length > 0;
  const permissionMap = new Map(role.permissions.map(item => [`${item.module}:${item.action}`, item.allowed]));
  document.querySelector('#permission-table').innerHTML = `<table><thead><tr><th>Module</th>${state.actions.map(action => `<th>${escapeHtml(action)}</th>`).join('')}</tr></thead><tbody>${state.modules.map(module => `<tr><td>${escapeHtml(moduleNames[module] || module)}</td>${state.actions.map(action => `<td><input type="checkbox" data-permission="${escapeHtml(module)}:${escapeHtml(action)}" ${permissionMap.get(`${module}:${action}`) ? 'checked' : ''} aria-label="${escapeHtml(moduleNames[module] || module)} ${escapeHtml(action)}" ${role.isSystem ? 'disabled' : ''} /></td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function readPermissionMatrix() {
  return [...document.querySelectorAll('[data-permission]')].map(input => {
    const [module, action] = input.dataset.permission.split(':');
    return { module, action, allowed: input.checked };
  });
}

async function createRole() {
  const name = prompt('Name for the new role:');
  if (!name?.trim()) return;
  try {
    const role = await api('/admin/roles', { method: 'POST', body: { name: name.trim(), permissions: permissionMatrix([]) } });
    showToast(`Role '${role.name}' created with no permissions. Grant Read access to at least one module before assigning users.`);
    await loadRolesView(document.querySelector('#view-content'));
    document.querySelector('#role-select').value = role.id;
    state.selectedRoleId = role.id;
    await loadRoleDetails();
  } catch (error) { showToast(error.message, true); }
}

async function cloneRole() {
  const role = state.selectedRole;
  if (!role) return;
  const name = prompt(`Name for the copy of '${role.name}':`);
  if (!name?.trim()) return;
  try {
    const cloned = await api(`/admin/roles/${encodeURIComponent(role.id)}/clone`, { method: 'POST', body: { name: name.trim() } });
    showToast(`Role '${cloned.name}' cloned.`);
    await loadRolesView(document.querySelector('#view-content'));
    document.querySelector('#role-select').value = cloned.id;
    state.selectedRoleId = cloned.id;
    await loadRoleDetails();
  } catch (error) { showToast(error.message, true); }
}

async function saveRole() {
  if (!state.selectedRole) return;
  try {
    const role = await api(`/admin/roles/${encodeURIComponent(state.selectedRole.id)}`, {
      method: 'PUT', body: { name: document.querySelector('#role-name').value.trim(), permissions: readPermissionMatrix() },
    });
    showToast(`Saved '${role.name}'. Changes apply to the next request.`);
    await loadRolesView(document.querySelector('#view-content'));
    document.querySelector('#role-select').value = role.id;
    state.selectedRoleId = role.id;
    await loadRoleDetails();
  } catch (error) { showToast(error.message, true); }
}

async function deleteRole() {
  if (!state.selectedRole || !confirm(`Delete role '${state.selectedRole.name}'?`)) return;
  try {
    await api(`/admin/roles/${encodeURIComponent(state.selectedRole.id)}`, { method: 'DELETE' });
    showToast('Role deleted.');
    await loadRolesView(document.querySelector('#view-content'));
  } catch (error) {
    if (error.code === 'ROLE_IN_USE') {
      const source = state.selectedRole;
      const targets = state.roles.filter(role => role.id !== source.id && role.systemKey !== 'super_admin');
      const menu = targets.map((role, index) => `${index + 1}. ${role.name}`).join('\n');
      const choice = Number(prompt(`This role has assigned users. Choose a role to reassign them to, or Cancel.\n${menu}`));
      const target = targets[choice - 1];
      if (!target) return;
      try {
        await api(`/admin/roles/${encodeURIComponent(source.id)}/reassign`, { method: 'POST', body: { targetRoleId: target.id } });
        await api(`/admin/roles/${encodeURIComponent(source.id)}`, { method: 'DELETE' });
        showToast(`Users reassigned to '${target.name}' and role deleted.`);
        await loadRolesView(document.querySelector('#view-content'));
      } catch (reassignError) { showToast(reassignError.message, true); }
    } else showToast(error.message, true);
  }
  if (state.notificationPollTimer) clearInterval(state.notificationPollTimer);
  state.notificationPollTimer = null;
}

async function loadUsersView(content) {
  const [usersResult, roles] = await Promise.all([
    api(`/admin/users?page=1&pageSize=100&query=${encodeURIComponent(state.search)}`),
    api('/admin/roles'),
  ]);
  state.users = usersResult.items;
  state.roles = roles;
  content.innerHTML = `
    <div class="section-head"><div><h2>Staff accounts</h2><p>Create access, change roles, or revoke a session immediately.</p></div><button class="button button-primary" id="new-user">＋ Add staff</button></div>
    <div class="panel"><div class="panel-head"><h3>Directory</h3><div class="toolbar"><input class="input search-input" id="user-search" type="search" placeholder="Search name or Login ID" value="${escapeHtml(state.search)}" aria-label="Search staff" /></div></div>
      <div class="table-wrap"><table><thead><tr><th>Staff member</th><th>Role</th><th>Status</th><th>Last sign-in</th><th>Actions</th></tr></thead><tbody>${state.users.length ? state.users.map(renderUserRow).join('') : '<tr><td colspan="5"><div class="empty">No staff accounts found.</div></td></tr>'}</tbody></table></div>
    </div>`;
  document.querySelector('#new-user').addEventListener('click', () => showUserDialog());
  const search = document.querySelector('#user-search');
  search.addEventListener('input', debounce(async () => { state.search = search.value.trim(); await loadUsersView(content); }, 250));
  content.querySelectorAll('[data-user-action]').forEach(button => button.addEventListener('click', handleUserAction));
}

function renderUserRow(user) {
  const isSuperAdmin = user.roleKey === 'super_admin';
  const actionButtons = isSuperAdmin ? '<span class="table-secondary">Protected account</span>' : `
    <div class="row-actions">
      <button class="button button-quiet button-small" data-user-action="edit" data-user-id="${escapeHtml(user.id)}">Edit</button>
      <button class="button button-quiet button-small" data-user-action="reset" data-user-id="${escapeHtml(user.id)}">Reset password</button>
      <button class="button button-${user.isActive ? 'danger' : 'quiet'} button-small" data-user-action="toggle" data-active="${user.isActive}" data-user-id="${escapeHtml(user.id)}">${user.isActive ? 'Suspend' : 'Activate'}</button>
      <button class="button button-danger button-small" data-user-action="remove" data-user-id="${escapeHtml(user.id)}">Remove</button>
    </div>`;
  return `<tr><td><span class="table-primary">${escapeHtml(user.name)}</span><span class="table-secondary">${escapeHtml(user.loginId || user.email)}</span></td><td>${escapeHtml(user.roleName)}</td><td><span class="status ${user.isActive ? '' : 'inactive'}">${user.isActive ? 'Active' : 'Suspended'}</span></td><td>${escapeHtml(user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never')}</td><td>${actionButtons}</td></tr>`;
}

async function handleUserAction(event) {
  const button = event.currentTarget;
  const user = state.users.find(item => item.id === button.dataset.userId);
  if (!user) return;
  try {
    if (button.dataset.userAction === 'edit') return showUserDialog(user);
    if (button.dataset.userAction === 'toggle') {
      const isActive = button.dataset.active !== 'true';
      const verb = isActive ? 'activate' : 'suspend';
      if (!confirm(`${verb[0].toUpperCase()}${verb.slice(1)} ${user.name}? Active sessions will be revoked.`)) return;
      await api(`/admin/users/${encodeURIComponent(user.id)}`, { method: 'PUT', body: { isActive } });
      showToast(`Account ${isActive ? 'activated' : 'suspended'}; active sessions were revoked.`);
    } else if (button.dataset.userAction === 'reset') {
      if (!confirm(`Issue a one-time password for ${user.name}? Existing sessions will be revoked.`)) return;
      const result = await api(`/admin/users/${encodeURIComponent(user.id)}/reset-password`, { method: 'POST', body: {} });
      showCredentialDialog('Temporary password', result.temporaryPassword, `Give this password to ${user.name}. It can only be viewed in this dialog now; the user must change it at next sign-in.`);
    } else if (button.dataset.userAction === 'remove') {
      if (!confirm(`Permanently remove ${user.name}? This cannot be undone.`)) return;
      await api(`/admin/users/${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      showToast('Staff account removed.');
    }
    await loadUsersView(document.querySelector('#view-content'));
  } catch (error) { showToast(error.message, true); }
}

function showUserDialog(user = null) {
  const isEdit = Boolean(user);
  const roles = state.roles.filter(role => !role.systemKey || role.systemKey !== 'super_admin');
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="user-dialog-title"><div class="dialog-head"><h2 id="user-dialog-title">${isEdit ? 'Edit staff account' : 'Create staff account'}</h2><button class="button button-quiet button-small" type="button" data-close>Close</button></div>
    <form id="user-form"><div class="dialog-body">
      <div class="field"><label for="staff-name">Full name</label><input class="input" id="staff-name" maxlength="120" value="${escapeHtml(user?.name || '')}" required /></div>
      <div class="field"><label for="staff-login-id">Login ID</label><input class="input" id="staff-login-id" type="text" minlength="3" maxlength="120" pattern="[A-Za-z0-9._@+-]+" value="${escapeHtml(user?.loginId || user?.email || '')}" required /></div>
      <div class="field"><label for="staff-role">Role</label><select class="select" id="staff-role" required>${roles.map(role => `<option value="${escapeHtml(role.id)}" ${user?.roleId === role.id ? 'selected' : ''}>${escapeHtml(role.name)}</option>`).join('')}</select></div>
      ${isEdit ? `<label class="toolbar"><input id="staff-active" type="checkbox" ${user.isActive ? 'checked' : ''} /> <span class="field-label">Account active</span></label>` : `<div class="field"><label for="staff-password">Initial password (12+ characters)</label><div class="toolbar"><input class="input" id="staff-password" type="text" minlength="12" autocomplete="new-password" required /><button class="button button-quiet" type="button" id="generate-staff-password">Generate strong password</button></div></div><label class="toolbar"><input id="staff-active" type="checkbox" checked /> <span class="field-label">Account active</span></label>`}
    </div><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>Cancel</button><button class="button button-primary" type="submit">${isEdit ? 'Save changes' : 'Create account'}</button></div></form></section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  if (!isEdit) backdrop.querySelector('#generate-staff-password').addEventListener('click', () => {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    backdrop.querySelector('#staff-password').value = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '') + '!aA7';
  });
  backdrop.querySelector('#user-form').addEventListener('submit', async event => {
    event.preventDefault();
    const body = {
      name: backdrop.querySelector('#staff-name').value.trim(),
      loginId: backdrop.querySelector('#staff-login-id').value.trim(),
      roleId: backdrop.querySelector('#staff-role').value,
    };
    try {
      if (isEdit) {
        body.isActive = backdrop.querySelector('#staff-active').checked;
        await api(`/admin/users/${encodeURIComponent(user.id)}`, { method: 'PUT', body });
        showToast('Staff account updated; existing sessions were revoked.');
      } else {
        body.password = backdrop.querySelector('#staff-password').value;
        body.isActive = backdrop.querySelector('#staff-active').checked;
        const result = await api('/admin/users', { method: 'POST', body });
        backdrop.remove();
        showCredentialDialog('One-time activation password', body.password, `Give this password to ${result.user.name}. It is shown only once and must be changed at first sign-in.`);
      }
      if (backdrop.isConnected) backdrop.remove();
      await loadUsersView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

function showCredentialDialog(title, credential, note) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="credential-title"><div class="dialog-head"><h2 id="credential-title">${escapeHtml(title)}</h2><button class="button button-quiet button-small" data-close>Close</button></div><div class="dialog-body"><p class="notice">${escapeHtml(note)}</p><div class="credential" id="credential-value">${escapeHtml(credential)}</div></div><div class="dialog-actions"><button class="button button-quiet" data-copy>Copy</button><button class="button button-primary" data-close>Done</button></div></section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('[data-copy]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(credential); showToast('Copied to clipboard.'); }
    catch { showToast('Select the password above to copy it.', true); }
  });
}

function permissionMatrix(allowed) {
  return state.modules.flatMap(module => state.actions.map(action => ({
    module,
    action,
    allowed: allowed.includes(`${module}:${action}`),
  })));
}

async function loadBooksView(content) {
  const [booksResult, categoriesResult] = await Promise.all([
    api(`/books?query=${encodeURIComponent(state.bookSearch)}&category=${encodeURIComponent(state.bookCategory || '')}&page=${state.bookPage}&pageSize=${state.bookPageSize}`),
    api('/books/categories'),
  ]);
  const categories = categoriesResult.items;
  content.innerHTML = `
    <div class="section-head"><div><h2>Book inventory</h2><p>Search the server catalog, update stock, or maintain categories.</p></div><div class="toolbar">
      ${can('books', 'write') ? '<button class="button button-primary" id="add-book">＋ Add book</button>' : ''}
      ${can('books', 'write') ? '<button class="button button-quiet" id="import-books">Import CSV</button><input id="csv-file" type="file" accept=".csv,text/csv" hidden />' : ''}
      <button class="button button-quiet" id="export-books">Export CSV</button>
    </div></div>
    <div class="panel"><div class="panel-head book-panel-head"><h3>Catalog</h3><div class="toolbar book-controls"><input class="input search-input" id="book-search" type="search" placeholder="Title, author, ISBN, category" value="${escapeHtml(state.bookSearch)}" aria-label="Search books" />
      <select class="select" id="book-category" aria-label="Filter by category"><option value="" ${state.bookCategory ? '' : 'selected'}>All categories</option>${categories.map(category => `<option value="${escapeHtml(category.id)}" ${state.bookCategory === category.id ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}</select>
      <label class="toolbar" style="gap:6px;font-size:11px;color:var(--muted)" for="book-page-size">Per page<select class="select" id="book-page-size" aria-label="Books per page"><option value="25" ${state.bookPageSize === 25 ? 'selected' : ''}>25</option><option value="50" ${state.bookPageSize === 50 ? 'selected' : ''}>50</option><option value="100" ${state.bookPageSize === 100 ? 'selected' : ''}>100</option></select></label>
      ${can('books', 'write') ? '<button class="button button-quiet button-small" id="manage-categories">Categories</button>' : ''}</div></div>
      <div class="table-wrap"><table><thead><tr><th>Book</th><th>Category / shelf</th><th>Copies</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${booksResult.items.length ? booksResult.items.map(book => `<tr>
        <td><span class="table-primary">${escapeHtml(book.title)}</span><span class="table-secondary">${escapeHtml(book.author)}${book.isbn ? ` · ISBN ${escapeHtml(book.isbn)}` : ''}</span></td>
        <td>${escapeHtml(book.category || 'Uncategorized')}<span class="table-secondary">${escapeHtml(book.shelfLocation || 'No shelf location')}</span></td>
        <td>${book.quantityAvailable} available / ${book.quantityTotal} total</td><td>${escapeHtml(new Date(book.updatedAt).toLocaleDateString())}</td>
        <td><div class="row-actions">${can('books', 'update') ? `<button class="button button-quiet button-small" data-book-action="edit" data-book-id="${escapeHtml(book.id)}">Edit</button>` : ''}${can('books', 'update') || (can('books', 'write') && !book.coverUrl) ? `<button class="button button-quiet button-small" data-book-action="cover" data-book-id="${escapeHtml(book.id)}">${book.coverUrl ? 'Change cover' : 'Upload cover'}</button>` : ''}${can('books', 'delete') ? `<button class="button button-danger button-small" data-book-action="delete" data-book-id="${escapeHtml(book.id)}">Delete</button>` : ''}</div></td>
      </tr>`).join('') : '<tr><td colspan="5"><div class="empty">No books in the server catalog yet.</div></td></tr>'}</tbody></table></div>
      <div class="panel-head"><span class="table-secondary">${booksResult.pagination.total} matching books · page ${booksResult.pagination.page} of ${booksResult.pagination.pageCount}</span>${booksResult.pagination.pageCount > 1 ? `<div class="toolbar"><button class="button button-quiet button-small" id="book-prev" ${booksResult.pagination.page <= 1 ? 'disabled' : ''}>Previous</button><span class="table-secondary">Page ${booksResult.pagination.page} of ${booksResult.pagination.pageCount}</span><button class="button button-quiet button-small" id="book-next" ${booksResult.pagination.page >= booksResult.pagination.pageCount ? 'disabled' : ''}>Next</button></div>` : ''}</div>
    </div>`;
  const search = document.querySelector('#book-search');
  search.addEventListener('input', debounce(async () => { state.bookSearch = search.value.trim(); state.bookPage = 1; await loadBooksView(content); }, 250));
  document.querySelector('#book-category').addEventListener('change', async event => {
    state.bookCategory = event.target.value;
    state.bookPage = 1;
    await loadBooksView(content);
  });
  document.querySelector('#book-page-size').addEventListener('change', async event => {
    state.bookPageSize = Number(event.target.value);
    state.bookPage = 1;
    await loadBooksView(content);
  });
  document.querySelector('#book-prev')?.addEventListener('click', async () => { state.bookPage = Math.max(1, state.bookPage - 1); await loadBooksView(content); });
  document.querySelector('#book-next')?.addEventListener('click', async () => { state.bookPage = Math.min(booksResult.pagination.pageCount, state.bookPage + 1); await loadBooksView(content); });
  document.querySelector('#add-book')?.addEventListener('click', () => showBookDialog(categories));
  document.querySelector('#manage-categories')?.addEventListener('click', () => manageBookCategories(categories));
  document.querySelector('#export-books').addEventListener('click', exportBooks);
  document.querySelector('#import-books')?.addEventListener('click', () => document.querySelector('#csv-file').click());
  document.querySelector('#csv-file')?.addEventListener('change', importBooks);
  content.querySelectorAll('[data-book-action]').forEach(button => button.addEventListener('click', async event => {
    const book = booksResult.items.find(item => item.id === event.currentTarget.dataset.bookId);
    if (!book) return;
    if (event.currentTarget.dataset.bookAction === 'edit') return showBookDialog(categories, book);
    if (event.currentTarget.dataset.bookAction === 'cover') return uploadBookCover(book);
    if (!confirm(`Delete '${book.title}' from the catalog?`)) return;
    try {
      await api(`/books/${encodeURIComponent(book.id)}`, { method: 'DELETE' });
      showToast('Book deleted.');
      await loadBooksView(content);
    } catch (error) { showToast(error.message, true); }
  }));
}

async function loadNewArrivalsView(content) {
  const [result, categoryResult] = await Promise.all([api('/books/new-arrivals?page=1&pageSize=100'), api('/books/categories')]);
  content.innerHTML = `
    <div class="section-head"><div><h2>New arrivals</h2><p>Publish recent acquisitions to the student app.</p></div>
      ${can('new_arrivals', 'write') ? '<button class="button button-primary" id="upload-new-arrival">＋ Upload new arrival</button>' : ''}</div>
    <div class="panel"><div class="panel-head"><h3>Published arrivals</h3><span class="table-secondary">${result.pagination.total} books</span></div>
      <div class="table-wrap"><table><thead><tr><th>Book</th><th>ISBN / publisher</th><th>Arrival date</th><th>Copies</th><th>Cover</th></tr></thead><tbody>${result.items.length ? result.items.map(book => `<tr>
        <td><span class="table-primary">${escapeHtml(book.title)}</span><span class="table-secondary">${escapeHtml(book.author)}</span></td>
        <td>${escapeHtml(book.isbn || '—')}<span class="table-secondary">${escapeHtml(book.publisher || '')}</span></td>
        <td>${escapeHtml(book.arrivalDate || '—')}</td><td>${book.quantityAvailable} available / ${book.quantityTotal} total</td>
        <td><div class="row-actions">${can('new_arrivals', 'update') ? `<button class="button button-quiet button-small" data-arrival-edit="${escapeHtml(book.id)}">Edit</button>` : ''}${can('new_arrivals', 'update') || (can('new_arrivals', 'write') && !book.coverUrl) ? `<button class="button button-quiet button-small" data-arrival-cover="${escapeHtml(book.id)}">${book.coverUrl ? 'Change cover' : 'Upload cover'}</button>` : book.coverUrl ? 'Uploaded' : ''}${can('new_arrivals', 'delete') ? `<button class="button button-danger button-small" data-arrival-delete="${escapeHtml(book.id)}">Remove</button>` : ''}</div></td>
      </tr>`).join('') : '<tr><td colspan="5"><div class="empty">No new arrivals have been uploaded yet.</div></td></tr>'}</tbody></table></div>
    </div>`;
  document.querySelector('#upload-new-arrival')?.addEventListener('click', () => showBookDialog(categoryResult.items, null, true));
  content.querySelectorAll('[data-arrival-edit]').forEach(button => button.addEventListener('click', () => {
    const book = result.items.find(item => item.id === button.dataset.arrivalEdit);
    if (book) showBookDialog(categoryResult.items, book, true);
  }));
  content.querySelectorAll('[data-arrival-delete]').forEach(button => button.addEventListener('click', async () => {
    const book = result.items.find(item => item.id === button.dataset.arrivalDelete);
    if (!book || !confirm(`Remove '${book.title}' from New Arrivals? It will remain in the Book Inventory.`)) return;
    try { await api(`/books/new-arrivals/${encodeURIComponent(book.id)}`, { method: 'DELETE' }); showToast('Removed from New Arrivals.'); await loadNewArrivalsView(content); }
    catch (error) { showToast(error.message, true); }
  }));
  content.querySelectorAll('[data-arrival-cover]').forEach(button => button.addEventListener('click', () => {
    const book = result.items.find(item => item.id === button.dataset.arrivalCover);
    if (book) uploadBookCover(book, true);
  }));
}

function showBookDialog(categories, book = null, newArrivalMode = false) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="book-dialog-title"><div class="dialog-head"><h2 id="book-dialog-title">${newArrivalMode ? 'Upload new arrival' : book ? 'Edit book' : 'Add book'}</h2><button class="button button-quiet button-small" data-close>Close</button></div>
  <form id="book-form"><div class="dialog-body">
    <div class="field"><label for="book-title">Title</label><input class="input" id="book-title" maxlength="300" value="${escapeHtml(book?.title || '')}" required /></div>
    <div class="field"><label for="book-author">Author</label><input class="input" id="book-author" maxlength="240" value="${escapeHtml(book?.author || '')}" required /></div>
    <div class="toolbar"><div class="field" style="flex:1"><label for="book-isbn">ISBN</label><input class="input" id="book-isbn" value="${escapeHtml(book?.isbn || '')}" /></div><div class="field" style="flex:1"><label for="book-publisher">Publisher</label><input class="input" id="book-publisher" value="${escapeHtml(book?.publisher || '')}" /></div></div>
    <div class="toolbar"><div class="field" style="flex:1"><label for="book-year">Publication year</label><input class="input" id="book-year" type="number" min="1000" max="9999" value="${escapeHtml(book?.publicationYear || '')}" /></div><div class="field" style="flex:1"><label for="book-category-id">Category</label><select class="select" id="book-category-id"><option value="">Uncategorized</option>${categories.map(category => `<option value="${escapeHtml(category.id)}" ${book?.categoryId === category.id ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}</select></div></div>
    <div class="field"><label for="book-shelf">Shelf location</label><input class="input" id="book-shelf" value="${escapeHtml(book?.shelfLocation || '')}" /></div>
    ${newArrivalMode || (!book && can('books', 'write')) || (book && can('books', 'update')) ? `<div class="field"><label for="book-cover-file">${book?.coverUrl ? 'Replace cover image' : 'Cover image (optional)'}</label><input class="input" id="book-cover-file" type="file" accept="image/jpeg,image/png,image/webp" /></div>` : ''}
    ${newArrivalMode ? `<div class="field"><label for="arrival-date">Arrival date</label><input class="input" id="arrival-date" type="date" value="${new Date().toISOString().slice(0, 10)}" required /></div>` : ''}
    <div class="toolbar"><div class="field" style="flex:1"><label for="book-total">Total copies</label><input class="input" id="book-total" type="number" min="0" value="${book?.quantityTotal ?? 0}" required /></div><div class="field" style="flex:1"><label for="book-available">Available copies</label><input class="input" id="book-available" type="number" min="0" value="${book?.quantityAvailable ?? 0}" required /></div></div>
    <div class="field"><label for="book-description">Description</label><textarea class="input" id="book-description" rows="3" maxlength="5000">${escapeHtml(book?.description || '')}</textarea></div>
  </div><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>Cancel</button><button class="button button-primary" type="submit">${book ? 'Save changes' : 'Add book'}</button></div></form></section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#book-form').addEventListener('submit', async event => {
    event.preventDefault();
    const body = {
      title: backdrop.querySelector('#book-title').value.trim(), author: backdrop.querySelector('#book-author').value.trim(),
      isbn: backdrop.querySelector('#book-isbn').value.trim() || null, publisher: backdrop.querySelector('#book-publisher').value.trim() || null,
      publicationYear: backdrop.querySelector('#book-year').value ? Number(backdrop.querySelector('#book-year').value) : null,
      categoryId: backdrop.querySelector('#book-category-id').value || null, shelfLocation: backdrop.querySelector('#book-shelf').value.trim() || null,
      quantityTotal: Number(backdrop.querySelector('#book-total').value), quantityAvailable: Number(backdrop.querySelector('#book-available').value),
      description: backdrop.querySelector('#book-description').value.trim() || null,
    };
    try {
      if (newArrivalMode) body.arrivalDate = backdrop.querySelector('#arrival-date').value;
      let savedBook;
      if (book && newArrivalMode) savedBook = await api(`/books/new-arrivals/${encodeURIComponent(book.id)}`, { method: 'PUT', body: { ...body, version: book.version } });
      else if (book) savedBook = await api(`/books/${encodeURIComponent(book.id)}`, { method: 'PUT', body: { ...body, version: book.version } });
      else if (newArrivalMode) savedBook = await api('/books/new-arrivals', { method: 'POST', body });
      else savedBook = await api('/books', { method: 'POST', body });
      const coverFile = backdrop.querySelector('#book-cover-file')?.files[0];
      if (coverFile) {
        try { await sendBookCover(savedBook, coverFile, newArrivalMode); }
        catch (error) {
          backdrop.remove();
          showToast(`Book saved, but cover upload failed: ${error.message}`, true);
          if (newArrivalMode) await loadNewArrivalsView(document.querySelector('#view-content'));
          else await loadBooksView(document.querySelector('#view-content'));
          return;
        }
      }
      backdrop.remove();
      showToast(newArrivalMode ? 'New arrival published to the app.' : book ? 'Book updated.' : 'Book added.');
      if (newArrivalMode) await loadNewArrivalsView(document.querySelector('#view-content'));
      else await loadBooksView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

async function manageBookCategories(categories) {
  showCategoryManager('Book categories', '/books/categories', categories, () => loadBooksView(document.querySelector('#view-content')));
}

function showCategoryManager(title, endpoint, categories, onChanged) {
  const backdrop = document.createElement('div'); backdrop.className = 'dialog-backdrop';
  const module = endpoint === '/books/categories' ? 'books' : 'e_resources';
  const list = categories.length ? categories.map(category => `<tr><td>${escapeHtml(category.name)}</td><td><div class="row-actions">${can(module, 'update') ? `<button class="button button-quiet button-small" data-category-edit="${escapeHtml(category.id)}">Rename</button>` : ''}${can(module, 'delete') ? `<button class="button button-danger button-small" data-category-delete="${escapeHtml(category.id)}">Delete</button>` : ''}</div></td></tr>`).join('') : '<tr><td colspan="2"><div class="empty">No categories yet.</div></td></tr>';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true"><div class="dialog-head"><h2>${escapeHtml(title)}</h2><button class="button button-quiet button-small" data-close>Close</button></div><div class="dialog-body">${can(module, 'write') ? '<form id="category-form" class="toolbar"><input class="input" id="category-name" aria-label="Category name" placeholder="Category name" maxlength="100" required /><button class="button button-primary" type="submit">Add</button></form>' : ''}<div class="table-wrap"><table><thead><tr><th>Name</th><th>Actions</th></tr></thead><tbody>${list}</tbody></table></div></div></section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#category-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await api(endpoint, { method: 'POST', body: { name: backdrop.querySelector('#category-name').value.trim() } });
      showToast('Category added.'); backdrop.remove(); await onChanged();
    } catch (error) { showToast(error.message, true); }
  });
  backdrop.querySelectorAll('[data-category-edit]').forEach(button => button.addEventListener('click', async () => {
    const category = categories.find(item => item.id === button.dataset.categoryEdit);
    const name = prompt(`Rename '${category.name}':`, category.name);
    if (!name?.trim() || name.trim() === category.name) return;
    try {
      await api(`${endpoint}/${encodeURIComponent(category.id)}`, { method: 'PUT', body: { name: name.trim() } });
      showToast('Category renamed.'); backdrop.remove(); await onChanged();
    } catch (error) { showToast(error.message, true); }
  }));
  backdrop.querySelectorAll('[data-category-delete]').forEach(button => button.addEventListener('click', async () => {
    const category = categories.find(item => item.id === button.dataset.categoryDelete);
    if (!confirm(`Delete '${category.name}'? Existing content will become uncategorized.`)) return;
    try {
      await api(`${endpoint}/${encodeURIComponent(category.id)}`, { method: 'DELETE' });
      showToast('Category deleted.'); backdrop.remove(); await onChanged();
    } catch (error) { showToast(error.message, true); }
  }));
}

async function exportBooks() {
  try {
    const response = await fetch('/api/v1/books/export.csv', { headers: { 'ngrok-skip-browser-warning': 'true', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) } });
    if (!response.ok) throw new Error('Could not export books.');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nu-lirc-books.csv';
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) { showToast(error.message, true); }
}

async function importBooks(event) {
  const file = event.currentTarget.files[0];
  if (!file) return;
  try {
    const response = await fetch('/api/v1/books/import.csv', {
      method: 'POST', headers: { 'content-type': 'text/csv', 'ngrok-skip-browser-warning': 'true', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) }, body: await file.text(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error?.message || 'CSV import failed.');
    showToast(`Imported ${result.data.imported} books; ${result.data.errors.length} rows need review.`);
    await loadBooksView(document.querySelector('#view-content'));
  } catch (error) { showToast(error.message, true); }
  finally { event.currentTarget.value = ''; }
}

async function sendBookCover(book, file, newArrivalMode = false) {
  if (file.size > 20 * 1024 * 1024) throw new Error('Cover images must be 20 MB or smaller.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  const form = new FormData(); form.append('cover', file);
  const endpoint = newArrivalMode
    ? `/api/v1/books/new-arrivals/${encodeURIComponent(book.id)}/cover`
    : `/api/v1/books/${encodeURIComponent(book.id)}/cover`;
  const response = await fetch(endpoint, { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) }, body: form });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error?.message || 'Cover upload failed.');
  return result.data;
}

async function uploadBookCover(book, newArrivalMode = false) {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
  input.addEventListener('change', async () => {
    const file = input.files[0]; if (!file) return;
    try {
      await sendBookCover(book, file, newArrivalMode);
      showToast('Cover uploaded.');
      const content = document.querySelector('#view-content');
      if (newArrivalMode) await loadNewArrivalsView(content);
      else await loadBooksView(content);
    } catch (error) { showToast(error.message, true); }
  });
  input.click();
}

async function loadClippingsView(content) {
  const result = await api('/clippings?page=1&pageSize=100');
  content.innerHTML = `<div class="section-head"><div><h2>Newspaper clippings</h2><p>Store scanned images and PDFs with searchable dates and topics.</p></div>${can('clippings', 'write') ? '<button class="button button-primary" id="add-clipping">＋ Upload clipping</button>' : ''}</div>
    <div class="panel"><div class="panel-head"><h3>Archive</h3><span class="table-secondary">${result.pagination.total} clippings</span></div><div class="table-wrap"><table><thead><tr><th>Date / title</th><th>Topic</th><th>Newspaper</th><th>Files</th><th>Actions</th></tr></thead><tbody>${result.items.length ? result.items.map(item => `<tr><td><span class="table-primary">${escapeHtml(item.title || 'Untitled clipping')}</span><span class="table-secondary">${escapeHtml(item.date)}</span></td><td>${escapeHtml(item.topic)}</td><td>${escapeHtml(item.newspaperName)}</td><td>${item.fileCount}</td><td><div class="row-actions">${can('clippings', 'update') ? `<button class="button button-quiet button-small" data-clip-edit="${escapeHtml(item.id)}">Edit</button>` : ''}${can('clippings', 'delete') ? `<button class="button button-danger button-small" data-clip-delete="${escapeHtml(item.id)}">Delete</button>` : ''}</div></td></tr>`).join('') : '<tr><td colspan="5"><div class="empty">No clippings have been uploaded.</div></td></tr>'}</tbody></table></div></div>`;
  document.querySelector('#add-clipping')?.addEventListener('click', showClippingDialog);
  content.querySelectorAll('[data-clip-edit]').forEach(button => button.addEventListener('click', async () => {
    try { showClippingDialog(await api(`/clippings/${encodeURIComponent(button.dataset.clipEdit)}`)); }
    catch (error) { showToast(error.message, true); }
  }));
  content.querySelectorAll('[data-clip-delete]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm('Delete this clipping and its uploaded files?')) return;
    try { await api(`/clippings/${encodeURIComponent(button.dataset.clipDelete)}`, { method: 'DELETE' }); showToast('Clipping deleted.'); await loadClippingsView(content); }
    catch (error) { showToast(error.message, true); }
  }));
}

function showClippingDialog(clipping = null) {
  const backdrop = document.createElement('div'); backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true"><div class="dialog-head"><h2>${clipping ? 'Edit clipping' : 'Upload clipping'}</h2><button class="button button-quiet button-small" data-close>Close</button></div><form id="clip-form"><div class="dialog-body">
    <div class="field"><label for="clip-title">Title for the clipping</label><input class="input" id="clip-title" maxlength="240" value="${escapeHtml(clipping?.title || '')}" required /></div>
    <div class="field"><label for="clip-date">Date</label><input class="input" id="clip-date" type="date" value="${escapeHtml(clipping?.date || new Date().toISOString().slice(0, 10))}" required /></div>
    <div class="field"><label for="clip-source">Source / newspaper</label><input class="input" id="clip-source" maxlength="160" placeholder="For example, The Hindu" value="${escapeHtml(clipping?.newspaperName || '')}" required /></div>
    ${clipping ? `<div class="field"><span class="field-label">Current PDF files</span><span class="table-secondary">${clipping.files?.length ? clipping.files.map(file => `<a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">${escapeHtml(file.originalName)}</a>`).join(' · ') : 'None uploaded yet'}</span></div>` : ''}
    <div class="field"><label>PDF newspaper clipping</label><div class="toolbar"><label class="button button-quiet" for="clip-files" style="cursor:pointer">Choose PDF file</label><span id="clip-file-name" class="table-secondary">No PDF selected</span></div><input id="clip-files" type="file" accept=".pdf,application/pdf" aria-label="Choose a newspaper clipping PDF" style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;z-index:-1" /><span class="table-secondary">PDF file up to 50 MB. You can also provide a source link below.</span></div>
    <div class="field"><label for="clip-source-url">Source link (optional)</label><input class="input" id="clip-source-url" type="url" maxlength="2000" placeholder="https://example.com/article" value="${escapeHtml(clipping?.sourceUrl || '')}" /></div>
    <div class="field"><label for="clip-notes">Notes (optional)</label><textarea class="input" id="clip-notes" rows="3">${escapeHtml(clipping?.notes || '')}</textarea></div>
  </div><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>Cancel</button><button class="button button-primary" type="submit">${clipping ? 'Save changes' : 'Upload clipping'}</button></div></form></section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#clip-files')?.addEventListener('change', event => {
    backdrop.querySelector('#clip-file-name').textContent = event.target.files[0]?.name || 'Choose a PDF, or provide a source link below.';
  });
  backdrop.querySelector('#clip-form').addEventListener('submit', async event => {
    event.preventDefault();
    const source = backdrop.querySelector('#clip-source').value.trim();
    const sourceUrl = backdrop.querySelector('#clip-source-url').value.trim();
    const files = [...(backdrop.querySelector('#clip-files')?.files || [])];
    const file = files[0];
    if (files.some(selectedFile => selectedFile.size > 50 * 1024 * 1024)) { showToast('PDF clippings must be 50 MB or smaller.', true); return; }
    if (!clipping && !file && !sourceUrl) { showToast('Choose a PDF or add a source link.', true); return; }
    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { showToast('Please select a PDF file.', true); return; }
    const body = { title: backdrop.querySelector('#clip-title').value.trim(), date: backdrop.querySelector('#clip-date').value, topic: source, newspaperName: source, sourceUrl: sourceUrl || null, notes: backdrop.querySelector('#clip-notes').value.trim() };
    try {
      if (clipping) {
        const version = Number(clipping.version);
        let updatedClipping;
        try {
          updatedClipping = await api(`/clippings/${encodeURIComponent(clipping.id)}`, { method: 'PUT', body: { ...body, version: Number.isInteger(version) && version > 0 ? version : undefined } });
        } catch (error) {
          if (error.code !== 'CLIPPING_NOT_FOUND') throw error;
          if (!can('clippings', 'write')) throw new Error('This clipping no longer exists. Ask someone with Clippings: Write access to create it again.');
          const form = new FormData();
          Object.entries(body).forEach(([key, value]) => { if (value !== null && value !== '') form.set(key, String(value)); });
          files.forEach(selectedFile => form.append('files', selectedFile));
          const response = await fetch('/api/v1/clippings', { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) }, body: form });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error?.message || 'Could not recreate the missing clipping.');
          backdrop.remove();
          showToast('Clipping uploaded successfully.');
          await loadClippingsView(document.querySelector('#view-content'));
          return;
        }
        clipping.version = updatedClipping.version;
        if (files.length) {
          const form = new FormData();
          files.forEach(selectedFile => form.append('files', selectedFile));
          const response = await fetch(`/api/v1/clippings/${encodeURIComponent(clipping.id)}/files`, { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) }, body: form });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error?.message || 'PDF upload failed.');
        }
      }
      else {
        const form = new FormData(); Object.entries(body).forEach(([key, value]) => { if (value !== null && value !== '') form.set(key, String(value)); });
        files.forEach(selectedFile => form.append('files', selectedFile));
        const response = await fetch('/api/v1/clippings', { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) }, body: form });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message || 'Upload failed.');
      }
      backdrop.remove(); showToast(clipping ? 'Clipping updated.' : 'Clipping uploaded.'); await loadClippingsView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message || 'Could not upload clipping. Check your connection and permissions.', true); }
  });
}

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

async function loadGeneralView(content) {
  const [info, holidaysResult] = await Promise.all([api('/general-info'), api('/holidays?page=1&pageSize=100')]);
  const timingByDay = new Map(info.timings.map(item => [item.weekday, item]));
  content.innerHTML = `<div class="section-head"><div><h2>Library information</h2><p>Publish rules, weekly hours, and contact information.</p></div><button class="button button-primary" id="save-info" ${can('general_info', 'update') ? '' : 'hidden'}>Save information</button></div>
    <div class="panel"><div class="panel-head"><h3>Rules and operating hours</h3><span class="table-secondary">Version ${info.version}</span></div><div class="panel-body"><div class="field"><label for="rules-markdown">Library rules (plain text / Markdown)</label><textarea class="input" id="rules-markdown" rows="6" maxlength="20000" ${can('general_info', 'update') ? '' : 'disabled'}>${escapeHtml(info.rulesMarkdown)}</textarea></div>
      <div style="height:15px"></div><div class="table-wrap"><table><thead><tr><th>Weekday</th><th>Opening</th><th>Closing</th><th>Notes</th></tr></thead><tbody>${weekdays.map(day => { const timing = timingByDay.get(day) || {}; return `<tr><td>${day}</td><td><input class="input timing-open" data-weekday="${day}" type="time" value="${escapeHtml(timing.opening || '')}" ${can('general_info', 'update') ? '' : 'disabled'} /></td><td><input class="input timing-close" data-weekday="${day}" type="time" value="${escapeHtml(timing.closing || '')}" ${can('general_info', 'update') ? '' : 'disabled'} /></td><td><input class="input timing-note" data-weekday="${day}" maxlength="300" value="${escapeHtml(timing.notes || '')}" ${can('general_info', 'update') ? '' : 'disabled'} /></td></tr>`; }).join('')}</tbody></table></div>
      <div class="toolbar" style="margin-top:14px"><div class="field" style="flex:1"><label for="contact-email">Contact email</label><input class="input" id="contact-email" type="email" value="${escapeHtml(info.contact.email || '')}" ${can('general_info', 'update') ? '' : 'disabled'} /></div><div class="field" style="flex:1"><label for="contact-phone">Contact phone</label><input class="input" id="contact-phone" value="${escapeHtml(info.contact.phone || '')}" ${can('general_info', 'update') ? '' : 'disabled'} /></div></div><div class="field" style="margin-top:10px"><label for="contact-address">Address</label><input class="input" id="contact-address" value="${escapeHtml(info.contact.address || '')}" ${can('general_info', 'update') ? '' : 'disabled'} /></div>
    </div></div>
    <div class="panel"><div class="panel-head"><h3>Holiday schedule</h3>${can('general_info', 'write') ? '<button class="button button-quiet button-small" id="add-holiday">＋ Add holiday</button>' : ''}</div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Name</th><th>Hours</th><th>Actions</th></tr></thead><tbody>${holidaysResult.items.length ? holidaysResult.items.map(holiday => `<tr><td>${escapeHtml(holiday.date)}</td><td>${escapeHtml(holiday.name)}</td><td>${holiday.isClosed ? 'Closed' : `${escapeHtml(holiday.specialOpening || '')}–${escapeHtml(holiday.specialClosing || '')}`}</td><td>${can('general_info', 'delete') ? `<button class="button button-danger button-small" data-holiday-delete="${escapeHtml(holiday.id)}">Delete</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="4"><div class="empty">No holidays have been entered.</div></td></tr>'}</tbody></table></div></div>`;
  document.querySelector('#save-info')?.addEventListener('click', async () => {
    const timings = weekdays.map(weekday => ({ weekday, opening: document.querySelector(`.timing-open[data-weekday="${weekday}"]`).value, closing: document.querySelector(`.timing-close[data-weekday="${weekday}"]`).value, notes: document.querySelector(`.timing-note[data-weekday="${weekday}"]`).value.trim() })).filter(item => item.opening || item.closing || item.notes);
    try {
      await api('/general-info', { method: 'PUT', body: { rulesMarkdown: document.querySelector('#rules-markdown').value, timings, contact: { email: document.querySelector('#contact-email').value.trim(), phone: document.querySelector('#contact-phone').value.trim(), address: document.querySelector('#contact-address').value.trim() }, version: info.version } });
      showToast('Library information saved.'); await loadGeneralView(content);
    } catch (error) { showToast(error.message, true); }
  });
  document.querySelector('#add-holiday')?.addEventListener('click', async () => {
    const name = prompt('Holiday name:'); if (!name?.trim()) return;
    const date = prompt('Date (YYYY-MM-DD):'); if (!date) return;
    try { await api('/holidays', { method: 'POST', body: { date, name: name.trim(), isClosed: true } }); showToast('Holiday added.'); await loadGeneralView(content); }
    catch (error) { showToast(error.message, true); }
  });
  content.querySelectorAll('[data-holiday-delete]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm('Remove this holiday?')) return;
    try { await api(`/holidays/${encodeURIComponent(button.dataset.holidayDelete)}`, { method: 'DELETE' }); showToast('Holiday removed.'); await loadGeneralView(content); }
    catch (error) { showToast(error.message, true); }
  }));
}

async function loadResourcesView(content) {
  const [resourceResult, categoriesResult] = await Promise.all([api('/e-resources?page=1&pageSize=100'), api('/e-resources/categories')]);
  state.resourceCategories = categoriesResult.items;
  content.innerHTML = `<div class="section-head"><div><h2>e-Resources</h2><p>Manage library links and campus/VPN access notes.</p></div><div class="toolbar">${can('e_resources', 'write') || can('e_resources', 'update') || can('e_resources', 'delete') ? '<button class="button button-quiet" id="add-resource-category">Manage categories</button>' : ''}${can('e_resources', 'write') ? '<button class="button button-primary" id="add-resource">＋ Add link</button>' : ''}</div></div>
    <div class="panel"><div class="panel-head"><h3>Digital resources</h3><span class="table-secondary">${resourceResult.pagination.total} resources</span></div><div class="table-wrap"><table><thead><tr><th>Resource</th><th>Category</th><th>Network</th><th>Actions</th></tr></thead><tbody>${resourceResult.items.length ? resourceResult.items.map(resource => `<tr><td><a class="table-primary" href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer">${escapeHtml(resource.title)}</a><span class="table-secondary">${escapeHtml(resource.description || resource.url)}</span></td><td>${escapeHtml(resource.category || 'Uncategorized')}</td><td>${resource.requiresCampusNetwork ? 'Campus / VPN' : 'Any network'}</td><td><div class="row-actions">${can('e_resources', 'update') ? `<button class="button button-quiet button-small" data-resource-edit="${escapeHtml(resource.id)}">Edit</button>` : ''}${can('e_resources', 'delete') ? `<button class="button button-danger button-small" data-resource-delete="${escapeHtml(resource.id)}">Delete</button>` : ''}</div></td></tr>`).join('') : '<tr><td colspan="4"><div class="empty">No e-resources have been added.</div></td></tr>'}</tbody></table></div></div>`;
  document.querySelector('#add-resource-category')?.addEventListener('click', async () => {
    showCategoryManager('e-Resource categories', '/e-resources/categories', state.resourceCategories, () => loadResourcesView(content));
  });
  document.querySelector('#add-resource')?.addEventListener('click', () => showResourceDialog());
  content.querySelectorAll('[data-resource-edit]').forEach(button => button.addEventListener('click', () => {
    const resource = resourceResult.items.find(item => item.id === button.dataset.resourceEdit);
    showResourceDialog(resource);
  }));
  content.querySelectorAll('[data-resource-delete]').forEach(button => button.addEventListener('click', async () => {
    const resource = resourceResult.items.find(item => item.id === button.dataset.resourceDelete);
    if (!confirm(`Delete '${resource?.title}'?`)) return;
    try { await api(`/e-resources/${encodeURIComponent(button.dataset.resourceDelete)}`, { method: 'DELETE' }); showToast('e-Resource deleted.'); await loadResourcesView(content); }
    catch (error) { showToast(error.message, true); }
  }));
}

function showResourceDialog(resource = null) {
  const backdrop = document.createElement('div'); backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true"><div class="dialog-head"><h2>${resource ? 'Edit e-Resource' : 'Add e-Resource'}</h2><button class="button button-quiet button-small" data-close>Close</button></div><form id="resource-form"><div class="dialog-body">
    <div class="field"><label for="resource-title">Title</label><input class="input" id="resource-title" value="${escapeHtml(resource?.title || '')}" required /></div>
    <div class="field"><label for="resource-url">URL</label><input class="input" id="resource-url" type="url" placeholder="https://" value="${escapeHtml(resource?.url || '')}" required /></div>
    <div class="field"><label for="resource-description">Description</label><textarea class="input" id="resource-description" rows="3">${escapeHtml(resource?.description || '')}</textarea></div>
    <div class="field"><label for="resource-category">Category</label><select class="select" id="resource-category"><option value="">Uncategorized</option>${state.resourceCategories.map(category => `<option value="${escapeHtml(category.id)}" ${resource?.categoryId === category.id ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}</select></div>
    <label class="toolbar"><input id="resource-campus" type="checkbox" ${resource?.requiresCampusNetwork ? 'checked' : ''} /><span class="field-label">Requires campus network or VPN</span></label>
  </div><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>Cancel</button><button class="button button-primary" type="submit">Save</button></div></form></section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#resource-form').addEventListener('submit', async event => {
    event.preventDefault();
    const body = { title: backdrop.querySelector('#resource-title').value.trim(), url: backdrop.querySelector('#resource-url').value.trim(), description: backdrop.querySelector('#resource-description').value.trim() || null, categoryId: backdrop.querySelector('#resource-category').value || null, requiresCampusNetwork: backdrop.querySelector('#resource-campus').checked };
    try {
      if (resource) await api(`/e-resources/${encodeURIComponent(resource.id)}`, { method: 'PUT', body: { ...body, version: resource.version } });
      else await api('/e-resources', { method: 'POST', body });
      backdrop.remove(); showToast(resource ? 'e-Resource updated.' : 'e-Resource added.'); await loadResourcesView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

async function loadAnnouncementsView(content) {
  const result = await api('/announcements?page=1&pageSize=100&includeUnpublished=true');
  content.innerHTML = `<div class="section-head"><div><h2>Announcements</h2><p>Publish dated notices for the student app.</p></div>${can('general_info', 'write') ? '<button class="button button-primary" id="new-announcement">＋ New announcement</button>' : ''}</div>
    <div class="panel"><div class="panel-head"><h3>Notices</h3><span class="table-secondary">${result.pagination.total} announcements</span></div><div class="table-wrap"><table><thead><tr><th>Announcement</th><th>Visibility</th><th>Window</th><th>Actions</th></tr></thead><tbody>${result.items.length ? result.items.map(item => `<tr><td><span class="table-primary">${escapeHtml(item.title)}</span><span class="table-secondary">${escapeHtml(item.body)}</span></td><td><span class="status ${item.isPublished ? '' : 'inactive'}">${item.isPublished ? 'Published' : 'Draft'}</span></td><td>${escapeHtml(item.startsAt ? new Date(item.startsAt).toLocaleString() : 'Now')}<span class="table-secondary">${escapeHtml(item.endsAt ? `Until ${new Date(item.endsAt).toLocaleString()}` : 'No end date')}</span></td><td><div class="row-actions">${can('general_info', 'update') ? `<button class="button button-quiet button-small" data-announcement-edit="${escapeHtml(item.id)}">Edit</button>` : ''}${can('general_info', 'delete') ? `<button class="button button-danger button-small" data-announcement-delete="${escapeHtml(item.id)}">Delete</button>` : ''}</div></td></tr>`).join('') : '<tr><td colspan="4"><div class="empty">No announcements yet.</div></td></tr>'}</tbody></table></div></div>`;
  document.querySelector('#new-announcement')?.addEventListener('click', () => showAnnouncementDialog());
  content.querySelectorAll('[data-announcement-edit]').forEach(button => button.addEventListener('click', () => showAnnouncementDialog(result.items.find(item => item.id === button.dataset.announcementEdit))));
  content.querySelectorAll('[data-announcement-delete]').forEach(button => button.addEventListener('click', async () => {
    const item = result.items.find(record => record.id === button.dataset.announcementDelete);
    if (!confirm(`Delete '${item?.title}'?`)) return;
    try { await api(`/announcements/${encodeURIComponent(button.dataset.announcementDelete)}`, { method: 'DELETE' }); showToast('Announcement deleted.'); await loadAnnouncementsView(content); }
    catch (error) { showToast(error.message, true); }
  }));
}

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function showAnnouncementDialog(item = null) {
  const backdrop = document.createElement('div'); backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true"><div class="dialog-head"><h2>${item ? 'Edit announcement' : 'New announcement'}</h2><button class="button button-quiet button-small" data-close>Close</button></div><form id="announcement-form"><div class="dialog-body">
    <div class="field"><label for="announcement-title">Title</label><input class="input" id="announcement-title" maxlength="240" value="${escapeHtml(item?.title || '')}" required /></div>
    <div class="field"><label for="announcement-body">Message</label><textarea class="input" id="announcement-body" rows="5" maxlength="10000" required>${escapeHtml(item?.body || '')}</textarea></div>
    <div class="toolbar"><div class="field" style="flex:1"><label for="announcement-start">Starts</label><input class="input" id="announcement-start" type="datetime-local" value="${toLocalInput(item?.startsAt)}" /></div><div class="field" style="flex:1"><label for="announcement-end">Ends</label><input class="input" id="announcement-end" type="datetime-local" value="${toLocalInput(item?.endsAt)}" /></div></div>
    <label class="toolbar"><input id="announcement-published" type="checkbox" ${item?.isPublished ? 'checked' : ''} /><span class="field-label">Published</span></label>
  </div><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>Cancel</button><button class="button button-primary" type="submit">Save</button></div></form></section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#announcement-form').addEventListener('submit', async event => {
    event.preventDefault();
    const asIso = selector => { const value = backdrop.querySelector(selector).value; return value ? new Date(value).toISOString() : null; };
    const body = { title: backdrop.querySelector('#announcement-title').value.trim(), body: backdrop.querySelector('#announcement-body').value.trim(), startsAt: asIso('#announcement-start'), endsAt: asIso('#announcement-end'), isPublished: backdrop.querySelector('#announcement-published').checked };
    try {
      if (item) await api(`/announcements/${encodeURIComponent(item.id)}`, { method: 'PUT', body: { ...body, version: item.version } });
      else await api('/announcements', { method: 'POST', body });
      backdrop.remove(); showToast('Announcement saved.'); await loadAnnouncementsView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

async function loadRoomsView(content) {
  const roomsResult = await api('/rooms?includeInactive=true');
  state.rooms = roomsResult.items || [];
  if (!state.selectedTimelineRoomId && state.rooms.length > 0) {
    state.selectedTimelineRoomId = state.rooms[0].id;
  }

  const query = new URLSearchParams({ page: 1, pageSize: 100 });
  if (state.roomStatusFilter) query.set('status', state.roomStatusFilter);
  if (state.roomFilter) query.set('roomId', state.roomFilter);
  if (state.roomDateFilter) query.set('date', state.roomDateFilter);
  if (state.roomSearch) query.set('query', state.roomSearch);
  const requestsResult = await api(`/room-requests?${query.toString()}`);

  let timelineBookings = [];
  if (state.selectedTimelineRoomId) {
    try {
      const avail = await api(`/rooms/availability?roomId=${encodeURIComponent(state.selectedTimelineRoomId)}&date=${encodeURIComponent(state.selectedTimelineDate)}`);
      timelineBookings = avail.bookings || [];
    } catch { timelineBookings = []; }
  }

  content.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Discussion Rooms</h2>
        <p>Manage rooms, review student requests, detect scheduling conflicts, and approve slots.</p>
      </div>
      <div class="toolbar">
        <a class="button button-quiet button-small" href="/api/v1/room-requests/export.csv" target="_blank" download>Export Requests CSV</a>
        ${can('discussion_rooms', 'write') ? '<button class="button button-primary button-small" id="new-room">＋ New room</button>' : ''}
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Room Directory</h3>
        <span class="table-secondary">${state.rooms.length} rooms</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Room Name</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${state.rooms.length ? state.rooms.map(room => `
              <tr>
                <td><span class="table-primary">${escapeHtml(room.name)}</span></td>
                <td>${room.capacity} students</td>
                <td><span class="status ${room.isActive ? '' : 'inactive'}">${room.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div class="row-actions">
                    ${can('discussion_rooms', 'update') ? `<button class="button button-quiet button-small" data-room-edit="${escapeHtml(room.id)}">Edit</button>` : ''}
                    ${can('discussion_rooms', 'delete') ? `<button class="button button-danger button-small" data-room-delete="${escapeHtml(room.id)}">Delete</button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="4"><div class="empty">No discussion rooms configured.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Room Availability & Approved Schedule</h3>
        <div class="toolbar">
          <select class="select" id="timeline-room-select" style="min-width:180px">
            ${state.rooms.map(r => `<option value="${escapeHtml(r.id)}" ${r.id === state.selectedTimelineRoomId ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}
          </select>
          <input class="input" id="timeline-date-input" type="date" value="${state.selectedTimelineDate}" style="width:160px" />
        </div>
      </div>
      <div class="panel-body">
        ${timelineBookings.length ? `
          <div>
            <p style="font-size:11px;color:var(--muted);margin:0 0 8px">Approved bookings for ${escapeHtml(state.selectedTimelineDate)}:</p>
            <div>
              ${timelineBookings.map(b => `<span class="timeline-slot">${escapeHtml(b.startTime)} – ${escapeHtml(b.endTime)}</span>`).join('')}
            </div>
          </div>
        ` : '<div style="font-size:12px;color:var(--muted)">No approved bookings on this date. Room is available all day.</div>'}
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Booking Requests Queue</h3>
        <span class="table-secondary">${requestsResult.pagination.total} requests</span>
      </div>
      <div class="panel-body" style="padding-bottom:0">
        <div class="toolbar">
          <select class="select" id="filter-room-status" style="width:140px">
            <option value="" ${!state.roomStatusFilter ? 'selected' : ''}>All Statuses</option>
            <option value="pending" ${state.roomStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${state.roomStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="denied" ${state.roomStatusFilter === 'denied' ? 'selected' : ''}>Denied</option>
            <option value="cancelled" ${state.roomStatusFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <select class="select" id="filter-room-id" style="width:160px">
            <option value="" ${!state.roomFilter ? 'selected' : ''}>All Rooms</option>
            ${state.rooms.map(r => `<option value="${escapeHtml(r.id)}" ${state.roomFilter === r.id ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}
          </select>
          <input class="input" id="filter-room-date" type="date" value="${state.roomDateFilter || ''}" style="width:150px" title="Filter by booking date" />
          <input class="input search-input" id="filter-room-search" type="search" value="${escapeHtml(state.roomSearch || '')}" placeholder="Search student name or email..." />
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Room & Time Slot</th>
              <th>Group & Purpose</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${requestsResult.items.length ? requestsResult.items.map(req => {
              const hasConflict = req.conflicts && req.conflicts.length > 0;
              return `
                <tr>
                  <td>
                    <span class="table-primary">${escapeHtml(req.studentName)}</span>
                    <span class="table-secondary">${escapeHtml(req.studentEmail)} ${req.enrollmentNo ? `(${escapeHtml(req.enrollmentNo)})` : ''} · ${escapeHtml(req.studentPhone || 'No phone')}</span>
                  </td>
                  <td>
                    <span class="table-primary">${escapeHtml(req.roomName)}</span>
                    <span class="table-secondary">${escapeHtml(req.date)} &middot; ${escapeHtml(req.startTime)} – ${escapeHtml(req.endTime)}</span>
                    ${hasConflict ? `
                      <div class="badge-conflict">
                        ⚠️ Conflict: Overlaps ${req.conflicts.map(c => `${escapeHtml(c.studentName)} (${escapeHtml(c.startTime)}-${escapeHtml(c.endTime)})`).join(', ')}
                      </div>
                    ` : ''}
                  </td>
                  <td>
                    <span class="table-primary">${req.groupSize} students</span>
                    <span class="table-secondary">${escapeHtml(req.purpose)}</span>
                  </td>
                  <td>
                    <span class="status status-${escapeHtml(req.status)}">${escapeHtml(req.status)}</span>
                    ${req.remarks ? `<span class="table-secondary">Remark: ${escapeHtml(req.remarks)}</span>` : ''}
                    ${req.overrideReason ? `<span class="table-secondary" style="color:var(--coral);font-weight:700">Override: ${escapeHtml(req.overrideReason)}</span>` : ''}
                  </td>
                  <td>
                    <div class="row-actions">
                      ${req.status === 'pending' && can('discussion_rooms', 'update') ? `
                        <button class="button button-primary button-small" data-approve-req="${escapeHtml(req.id)}">Approve</button>
                        <button class="button button-danger button-small" data-deny-req="${escapeHtml(req.id)}">Deny</button>
                      ` : ''}
                      ${req.status === 'approved' && can('discussion_rooms', 'update') ? `
                        <button class="button button-quiet button-small" data-cancel-req="${escapeHtml(req.id)}">Cancel</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="5"><div class="empty">No room booking requests found.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.querySelector('#new-room')?.addEventListener('click', () => showRoomDialog());
  content.querySelectorAll('[data-room-edit]').forEach(button => button.addEventListener('click', () => {
    const room = state.rooms.find(r => r.id === button.dataset.roomEdit);
    showRoomDialog(room);
  }));
  content.querySelectorAll('[data-room-delete]').forEach(button => button.addEventListener('click', async () => {
    const room = state.rooms.find(r => r.id === button.dataset.roomDelete);
    if (!confirm(`Delete room '${room?.name}'?`)) return;
    try {
      await api(`/rooms/${encodeURIComponent(button.dataset.roomDelete)}`, { method: 'DELETE' });
      showToast('Room deleted.');
      await loadRoomsView(content);
    } catch (error) { showToast(error.message, true); }
  }));

  document.querySelector('#timeline-room-select')?.addEventListener('change', async event => {
    state.selectedTimelineRoomId = event.target.value;
    await loadRoomsView(content);
  });
  document.querySelector('#timeline-date-input')?.addEventListener('change', async event => {
    state.selectedTimelineDate = event.target.value;
    await loadRoomsView(content);
  });

  document.querySelector('#filter-room-status')?.addEventListener('change', async event => {
    state.roomStatusFilter = event.target.value;
    await loadRoomsView(content);
  });
  document.querySelector('#filter-room-id')?.addEventListener('change', async event => {
    state.roomFilter = event.target.value;
    await loadRoomsView(content);
  });
  document.querySelector('#filter-room-date')?.addEventListener('change', async event => {
    state.roomDateFilter = event.target.value;
    await loadRoomsView(content);
  });
  const searchInput = document.querySelector('#filter-room-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(async event => {
      state.roomSearch = event.target.value.trim();
      await loadRoomsView(content);
    }, 300));
  }

  content.querySelectorAll('[data-approve-req]').forEach(button => button.addEventListener('click', () => {
    const req = requestsResult.items.find(r => r.id === button.dataset.approveReq);
    if (req) showApproveRoomDialog(req);
  }));
  content.querySelectorAll('[data-deny-req]').forEach(button => button.addEventListener('click', () => {
    const req = requestsResult.items.find(r => r.id === button.dataset.denyReq);
    if (req) showDenyRoomDialog(req);
  }));
  content.querySelectorAll('[data-cancel-req]').forEach(button => button.addEventListener('click', async () => {
    const req = requestsResult.items.find(r => r.id === button.dataset.cancelReq);
    if (!confirm(`Cancel approved booking for ${req?.studentName}?`)) return;
    try {
      await api(`/room-requests/${encodeURIComponent(button.dataset.cancelReq)}/cancel`, { method: 'PATCH' });
      showToast('Booking cancelled.');
      await loadRoomsView(content);
    } catch (error) { showToast(error.message, true); }
  }));
}

function showRoomDialog(room = null) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `
    <section class="dialog" role="dialog" aria-modal="true">
      <div class="dialog-head">
        <h2>${room ? 'Edit discussion room' : 'New discussion room'}</h2>
        <button class="button button-quiet button-small" data-close>Close</button>
      </div>
      <form id="room-form">
        <div class="dialog-body">
          <div class="field">
            <label for="room-name">Room name</label>
            <input class="input" id="room-name" maxlength="120" value="${escapeHtml(room?.name || '')}" placeholder="e.g. Discussion Room 1" required />
          </div>
          <div class="field">
            <label for="room-capacity">Capacity (students)</label>
            <input class="input" id="room-capacity" type="number" min="1" max="1000" value="${room?.capacity || 6}" required />
          </div>
          <label class="toolbar">
            <input id="room-active" type="checkbox" ${room ? (room.isActive ? 'checked' : '') : 'checked'} />
            <span class="field-label">Active for booking</span>
          </label>
        </div>
        <div class="dialog-actions">
          <button class="button button-quiet" type="button" data-close>Cancel</button>
          <button class="button button-primary" type="submit">Save</button>
        </div>
      </form>
    </section>
  `;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#room-form').addEventListener('submit', async event => {
    event.preventDefault();
    const name = backdrop.querySelector('#room-name').value.trim();
    const capacity = parseInt(backdrop.querySelector('#room-capacity').value, 10);
    const isActive = backdrop.querySelector('#room-active').checked;
    try {
      if (room) {
        await api(`/rooms/${encodeURIComponent(room.id)}`, { method: 'PUT', body: { name, capacity, isActive, version: room.version } });
      } else {
        await api('/rooms', { method: 'POST', body: { name, capacity, isActive } });
      }
      backdrop.remove();
      showToast(room ? 'Room updated.' : 'Room created.');
      await loadRoomsView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

function showApproveRoomDialog(req) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  const hasConflict = req.conflicts && req.conflicts.length > 0;
  backdrop.innerHTML = `
    <section class="dialog" role="dialog" aria-modal="true">
      <div class="dialog-head">
        <h2>Approve Room Request</h2>
        <button class="button button-quiet button-small" data-close>Close</button>
      </div>
      <form id="approve-form">
        <div class="dialog-body">
          <div style="font-size:12px;background:#f5f7f3;padding:10px;border-radius:4px">
            <strong>${escapeHtml(req.studentName)}</strong> (${escapeHtml(req.studentEmail)})<br />
            <span>${escapeHtml(req.roomName)} &middot; ${escapeHtml(req.date)} &middot; ${escapeHtml(req.startTime)} – ${escapeHtml(req.endTime)}</span>
          </div>
          ${hasConflict ? `
            <div class="notice error">
              <strong>⚠️ Overlapping Approved Booking Detected!</strong><br />
              This slot overlaps with an already approved booking:<br />
              ${req.conflicts.map(c => `&bull; ${escapeHtml(c.studentName)} (${escapeHtml(c.startTime)} – ${escapeHtml(c.endTime)})`).join('<br />')}
              <p style="margin:8px 0 0;font-size:11px">Server rule: To approve this conflicting booking, you MUST provide a manager override reason.</p>
            </div>
            <div class="field">
              <label for="override-reason" style="color:var(--coral)">Manager Override Reason (Required for conflict) *</label>
              <textarea class="input" id="override-reason" rows="3" maxlength="1000" placeholder="e.g. Special department meeting authorized by Dean" required></textarea>
            </div>
          ` : ''}
          <div class="field">
            <label for="approve-remarks">Remarks for student (Optional)</label>
            <input class="input" id="approve-remarks" maxlength="2000" placeholder="e.g. Key is available at circulation counter" />
          </div>
        </div>
        <div class="dialog-actions">
          <button class="button button-quiet" type="button" data-close>Cancel</button>
          <button class="button button-primary" type="submit">Confirm Approval</button>
        </div>
      </form>
    </section>
  `;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#approve-form').addEventListener('submit', async event => {
    event.preventDefault();
    const remarks = backdrop.querySelector('#approve-remarks').value.trim();
    const overrideReason = hasConflict ? backdrop.querySelector('#override-reason').value.trim() : undefined;
    if (hasConflict && !overrideReason) {
      showToast('Manager override reason is required for conflicting bookings.', true);
      return;
    }
    try {
      await api(`/room-requests/${encodeURIComponent(req.id)}/decision`, {
        method: 'PATCH',
        body: { status: 'approved', remarks, overrideReason, version: req.version },
      });
      backdrop.remove();
      showToast('Room booking approved!');
      await loadRoomsView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

function showDenyRoomDialog(req) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `
    <section class="dialog" role="dialog" aria-modal="true">
      <div class="dialog-head">
        <h2>Deny Room Request</h2>
        <button class="button button-quiet button-small" data-close>Close</button>
      </div>
      <form id="deny-form">
        <div class="dialog-body">
          <div style="font-size:12px;background:#f5f7f3;padding:10px;border-radius:4px">
            <strong>${escapeHtml(req.studentName)}</strong> &middot; ${escapeHtml(req.roomName)}<br />
            <span>${escapeHtml(req.date)} &middot; ${escapeHtml(req.startTime)} – ${escapeHtml(req.endTime)}</span>
          </div>
          <div class="field">
            <label for="deny-remarks">Reason / Remarks for student (Optional)</label>
            <textarea class="input" id="deny-remarks" rows="3" maxlength="2000" placeholder="e.g. Room reserved for examination preparations"></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="button button-quiet" type="button" data-close>Cancel</button>
          <button class="button button-danger" type="submit">Confirm Denial</button>
        </div>
      </form>
    </section>
  `;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#deny-form').addEventListener('submit', async event => {
    event.preventDefault();
    const remarks = backdrop.querySelector('#deny-remarks').value.trim();
    try {
      await api(`/room-requests/${encodeURIComponent(req.id)}/decision`, {
        method: 'PATCH',
        body: { status: 'denied', remarks, version: req.version },
      });
      backdrop.remove();
      showToast('Room request denied.');
      await loadRoomsView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

async function loadBookRequestsView(content) {
  const query = new URLSearchParams({ page: 1, pageSize: 100 });
  if (state.bookRequestStatusFilter) query.set('status', state.bookRequestStatusFilter);
  if (state.bookRequestSearch) query.set('query', state.bookRequestSearch);
  const result = await api(`/book-requests?${query.toString()}`);

  content.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Book Requests</h2>
        <p>Review book procurement and acquisition recommendations submitted by students.</p>
      </div>
      <div class="toolbar">
        <a class="button button-quiet button-small" href="/api/v1/book-requests/export.csv" target="_blank" download>Export Requests CSV</a>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Acquisition Queue</h3>
        <span class="table-secondary">${result.pagination.total} requests</span>
      </div>
      <div class="panel-body" style="padding-bottom:0">
        <div class="toolbar">
          <select class="select" id="filter-book-status" style="width:140px">
            <option value="" ${!state.bookRequestStatusFilter ? 'selected' : ''}>All Statuses</option>
            <option value="pending" ${state.bookRequestStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="done" ${state.bookRequestStatusFilter === 'done' ? 'selected' : ''}>Done</option>
            <option value="rejected" ${state.bookRequestStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
          <input class="input search-input" id="filter-book-search" type="search" value="${escapeHtml(state.bookRequestSearch || '')}" placeholder="Search student or book title..." />
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Book Title & Details</th>
              <th>Student</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${result.items.length ? result.items.map(req => `
              <tr>
                <td>
                  <span class="table-primary">${escapeHtml(req.title)}</span>
                  <span class="table-secondary">${escapeHtml([req.author, req.publisher, req.edition].filter(Boolean).join(' &middot; '))}</span>
                  ${req.catalogBookId ? '<span class="status" style="margin-top:3px">Linked to Catalog</span>' : ''}
                </td>
                <td>
                  <span class="table-primary">${escapeHtml(req.studentName)}</span>
                  <span class="table-secondary">${escapeHtml(req.studentEmail)} ${req.enrollmentNo ? `(${escapeHtml(req.enrollmentNo)})` : ''} · ${escapeHtml(req.studentPhone || 'No phone')}</span>
                </td>
                <td>
                  <span class="table-secondary">${escapeHtml(req.reason)}</span>
                </td>
                <td>
                  <span class="status status-${escapeHtml(req.status)}">${escapeHtml(req.status)}</span>
                  ${req.remarks ? `<span class="table-secondary">Remark: ${escapeHtml(req.remarks)}</span>` : ''}
                </td>
                <td>
                  <div class="row-actions">
                    ${req.status === 'pending' && can('book_requests', 'update') ? `
                      <button class="button button-primary button-small" data-fulfill-book="${escapeHtml(req.id)}">Mark Done</button>
                      <button class="button button-danger button-small" data-reject-book="${escapeHtml(req.id)}">Reject</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="5"><div class="empty">No book requests found.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.querySelector('#filter-book-status')?.addEventListener('change', async event => {
    state.bookRequestStatusFilter = event.target.value;
    await loadBookRequestsView(content);
  });
  const bookSearchInput = document.querySelector('#filter-book-search');
  if (bookSearchInput) {
    bookSearchInput.addEventListener('input', debounce(async event => {
      state.bookRequestSearch = event.target.value.trim();
      await loadBookRequestsView(content);
    }, 300));
  }

  content.querySelectorAll('[data-fulfill-book]').forEach(button => button.addEventListener('click', () => {
    const req = result.items.find(r => r.id === button.dataset.fulfillBook);
    if (req) showBookFulfillDialog(req);
  }));
  content.querySelectorAll('[data-reject-book]').forEach(button => button.addEventListener('click', () => {
    const req = result.items.find(r => r.id === button.dataset.rejectBook);
    if (req) showBookRejectDialog(req);
  }));
}

function showBookFulfillDialog(req) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `
    <section class="dialog" role="dialog" aria-modal="true">
      <div class="dialog-head">
        <h2>Fulfill Book Request</h2>
        <button class="button button-quiet button-small" data-close>Close</button>
      </div>
      <form id="fulfill-book-form">
        <div class="dialog-body">
          <div style="font-size:12px;background:#f5f7f3;padding:10px;border-radius:4px">
            <strong>${escapeHtml(req.title)}</strong><br />
            <span>Requested by ${escapeHtml(req.studentName)} (${escapeHtml(req.studentEmail)})</span>
          </div>
          <div class="field">
            <label for="fulfill-remarks">Remarks for student (Optional)</label>
            <input class="input" id="fulfill-remarks" maxlength="2000" placeholder="e.g. Book procured and placed on Shelf 4B" />
          </div>
        </div>
        <div class="dialog-actions">
          <button class="button button-quiet" type="button" data-close>Cancel</button>
          <button class="button button-primary" type="submit">Mark Done</button>
        </div>
      </form>
    </section>
  `;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#fulfill-book-form').addEventListener('submit', async event => {
    event.preventDefault();
    const remarks = backdrop.querySelector('#fulfill-remarks').value.trim();
    try {
      await api(`/book-requests/${encodeURIComponent(req.id)}/decision`, {
        method: 'PATCH',
        body: { status: 'done', remarks, version: req.version },
      });
      backdrop.remove();
      showToast('Book request marked as Done.');
      await loadBookRequestsView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

function showBookRejectDialog(req) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `
    <section class="dialog" role="dialog" aria-modal="true">
      <div class="dialog-head">
        <h2>Reject Book Request</h2>
        <button class="button button-quiet button-small" data-close>Close</button>
      </div>
      <form id="reject-book-form">
        <div class="dialog-body">
          <div style="font-size:12px;background:#f5f7f3;padding:10px;border-radius:4px">
            <strong>${escapeHtml(req.title)}</strong><br />
            <span>Requested by ${escapeHtml(req.studentName)}</span>
          </div>
          <div class="field">
            <label for="reject-remarks">Reason / Remarks for student (Optional)</label>
            <textarea class="input" id="reject-remarks" rows="3" maxlength="2000" placeholder="e.g. Book is out of print or duplicate copy already in reserves"></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="button button-quiet" type="button" data-close>Cancel</button>
          <button class="button button-danger" type="submit">Reject Request</button>
        </div>
      </form>
    </section>
  `;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.querySelector('#reject-book-form').addEventListener('submit', async event => {
    event.preventDefault();
    const remarks = backdrop.querySelector('#reject-remarks').value.trim();
    try {
      await api(`/book-requests/${encodeURIComponent(req.id)}/decision`, {
        method: 'PATCH',
        body: { status: 'rejected', remarks, version: req.version },
      });
      backdrop.remove();
      showToast('Book request rejected.');
      await loadBookRequestsView(document.querySelector('#view-content'));
    } catch (error) { showToast(error.message, true); }
  });
}

function setupRealtimeEvents() {
  if (state.sseSource) {
    try { state.sseSource.close(); } catch {}
    state.sseSource = null;
  }
  if (state.notificationPollTimer) clearInterval(state.notificationPollTimer);
  state.notificationPollTimer = null;
  refreshNotifications(false);
  state.notificationPollTimer = setInterval(() => refreshNotifications(true), 20000);
  try {
    const es = new EventSource('/api/v1/updates/stream');
    state.sseSource = es;
    es.onopen = () => {
      state.sseStatus = 'connected';
      updateLiveBadge();
    };
    es.onerror = () => {
      state.sseStatus = 'reconnecting';
      updateLiveBadge();
    };
    es.addEventListener('change', event => {
      try {
        const change = JSON.parse(event.data);
        handleRealtimeUpdate(change);
        refreshNotifications(true);
      } catch {}
    });
  } catch {
    state.sseStatus = 'disconnected';
    updateLiveBadge();
  }
}

function dismissedNotificationIds() {
  const userKey = state.user?.id || state.user?.loginId || 'current';
  try {
    const value = JSON.parse(localStorage.getItem(`nuLircDismissedNotifications:${userKey}`) || '[]');
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}

async function refreshNotifications(showNew = true) {
  if (!state.user) return;
  try {
    const result = await api('/notifications');
    const owner = String(state.user.id || state.user.loginId || 'current');
    const ownerChanged = owner !== state.notificationOwner;
    if (ownerChanged) {
      state.notificationOwner = owner;
      state.notificationSeenIds = new Set();
      state.notificationsInitialized = false;
    }
    const dismissed = dismissedNotificationIds();
    const items = result.items.filter(item => !dismissed.has(String(item.id)));
    if (!state.notificationsInitialized) {
      items.forEach(item => state.notificationSeenIds.add(String(item.id)));
      state.notificationsInitialized = true;
    } else {
      const newlyArrived = items.filter(item => !state.notificationSeenIds.has(String(item.id)));
      newlyArrived.forEach(item => state.notificationSeenIds.add(String(item.id)));
      if (showNew && newlyArrived.length) showNotificationToast(newlyArrived[0]);
    }
    state.notifications = items;
    renderNotifications();
  } catch {
    // The feed stays quiet during temporary disconnects; the next poll retries.
  }
}

function renderNotifications() {
  const button = document.querySelector('#notification-toggle');
  const count = document.querySelector('#notification-count');
  const dropdown = document.querySelector('#notification-dropdown');
  if (!button || !count || !dropdown) return;
  const total = state.notifications.length;
  count.hidden = total === 0;
  count.textContent = total > 9 ? '9+' : String(total);
  button.classList.toggle('has-notifications', total > 0);
  dropdown.innerHTML = `<div class="notification-dropdown-head"><strong>Notifications</strong><span>${total} update${total === 1 ? '' : 's'}</span></div>
    ${total ? state.notifications.map(item => `
      <article class="notification-item">
        <div class="notification-item-top"><span class="status">${escapeHtml(moduleNames[item.module] || item.module)}</span><button type="button" data-dismiss-notification="${escapeHtml(item.id)}" aria-label="Remove notification">×</button></div>
        <p>${escapeHtml(item.summary)}</p>
        <span class="notification-time">${escapeHtml(new Date(item.createdAt).toLocaleString())}</span>
      </article>
    `).join('') : '<div class="notification-empty">No updates for your accessible modules.</div>'}`;
}

function dismissNotification(id) {
  const keyUser = state.user?.id || state.user?.loginId || 'current';
  const key = `nuLircDismissedNotifications:${keyUser}`;
  const dismissed = dismissedNotificationIds();
  dismissed.add(String(id));
  try { localStorage.setItem(key, JSON.stringify([...dismissed].slice(-300))); } catch {}
  state.notifications = state.notifications.filter(item => String(item.id) !== String(id));
  renderNotifications();
}

function showNotificationToast(item) {
  const toast = document.querySelector('#notification-toast');
  if (!toast) return;
  clearTimeout(state.notificationToastTimer);
  toast.textContent = `New notification · ${item.summary}`;
  toast.hidden = false;
  toast.classList.add('visible');
  state.notificationToastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => { toast.hidden = true; }, 220);
  }, 6500);
}

function updateLiveBadge() {
  const el = document.querySelector('#live-indicator');
  const txt = document.querySelector('#live-text');
  if (!el || !txt) return;
  if (state.sseStatus === 'connected') {
    el.style.borderColor = '#2d5a50';
    el.style.color = 'var(--lime)';
    txt.textContent = 'Connected to server';
  } else {
    el.style.borderColor = '#bd493c';
    el.style.color = '#fff0ed';
    txt.textContent = 'Not connected';
  }
}

function handleRealtimeUpdate(change) {
  const viewContent = document.querySelector('#view-content');
  if (!viewContent) return;
  if (state.activeView === 'dashboard') {
    loadDashboardView(viewContent);
  } else if (state.activeView === 'rooms' && change.module === 'discussion_rooms') {
    loadRoomsView(viewContent);
  } else if (state.activeView === 'book_requests' && change.module === 'book_requests') {
    loadBookRequestsView(viewContent);
  } else if (state.activeView === 'books' && change.module === 'books') {
    loadBooksView(viewContent);
  } else if (state.activeView === 'audit') {
    loadAuditView(viewContent);
  }
}

async function loadDashboardView(content) {
  const stats = await api('/dashboard/stats');
  const maxWeekly = Math.max(1, ...stats.weeklyActivity.map(w => w.roomRequests));

  content.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Library Operations Dashboard</h2>
        <p>Live inventory counts, room reservation queue, book acquisitions, and activity feed.</p>
      </div>
      <button class="button button-quiet button-small" id="refresh-dashboard">↻ Refresh</button>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <p class="eyebrow">Catalog Inventory</p>
        <div class="stat-val">${stats.inventory.totalBooks}</div>
        <div class="stat-sub">${stats.inventory.availableCopies} available / ${stats.inventory.totalCopies} total copies &middot; ${stats.inventory.categories} categories</div>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Discussion Rooms</p>
        <div class="stat-val">${stats.rooms.approvedToday}</div>
        <div class="stat-sub">${stats.rooms.pendingRequests} pending requests (${stats.rooms.activeRooms} active rooms)</div>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Book Acquisition</p>
        <div class="stat-val">${stats.bookRequests.pendingRequests}</div>
        <div class="stat-sub">${stats.bookRequests.totalRequests} student requisitions submitted</div>
      </div>
      <div class="stat-card">
        <p class="eyebrow">Media & Resources</p>
        <div class="stat-val">${stats.content.clippings}</div>
        <div class="stat-sub">${stats.content.resources} e-resources &middot; ${stats.content.announcements} published notices</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Room Bookings (Past 7 Days)</h3>
        <span class="table-secondary">Daily approved reservations</span>
      </div>
      <div class="panel-body">
        <div class="chart-bars">
          ${stats.weeklyActivity.map(w => {
            const pct = Math.round((w.roomRequests / maxWeekly) * 100);
            return `
              <div class="bar-col">
                <span class="bar-val">${w.roomRequests}</span>
                <div class="bar-track">
                  <div class="bar-fill" style="height: ${Math.max(4, pct)}%"></div>
                </div>
                <span class="bar-label">${escapeHtml(w.label)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

  `;

  document.querySelector('#refresh-dashboard')?.addEventListener('click', () => loadDashboardView(content));
}

async function loadActivityFeedView(content) {
  const stats = await api('/dashboard/stats');
  content.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Recent Operations & Activity Feed</h2>
        <p>Latest library operations recorded by the system.</p>
      </div>
      <div class="toolbar"><button class="button button-quiet button-small" id="download-activity">Download all activity</button><button class="button button-quiet button-small" id="refresh-activity-feed">↻ Refresh</button></div>
    </div>
    <div class="panel">
      <div class="panel-head">
        <h3>Recent activity</h3>
        <span class="table-secondary">${stats.recentActivity.length} latest events</span>
      </div>
      <div class="panel-body">
        ${stats.recentActivity.length ? `
          <div class="activity-list">
            ${stats.recentActivity.map(a => `
              <div class="activity-item">
                <div>
                  <span class="activity-title">${escapeHtml(a.summary)}</span>
                  <div class="activity-meta">
                    <span>${escapeHtml(a.actorEmail || 'System')}</span> &middot;
                    <span class="status" style="font-size:9px;padding:2px 5px">${escapeHtml(moduleNames[a.module] || a.module)}</span> &middot;
                    <span>${escapeHtml(new Date(a.createdAt).toLocaleString())}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<div class="empty">No activity recorded yet.</div>'}
      </div>
    </div>
  `;
  document.querySelector('#refresh-activity-feed')?.addEventListener('click', () => loadActivityFeedView(content));
  document.querySelector('#download-activity')?.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/v1/dashboard/activity.csv', {
        headers: { 'ngrok-skip-browser-warning': 'true', ...(state.token ? { authorization: 'Bearer ' + state.token } : {}) },
      });
      if (!response.ok) throw new Error('Could not download activity.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'activity-feed.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) { showToast(error.message, true); }
  });
}

async function loadAuditView(content) {
  const query = new URLSearchParams({ page: state.auditPage, pageSize: 25 });
  if (state.auditModuleFilter) query.set('module', state.auditModuleFilter);
  if (state.auditActionFilter) query.set('action', state.auditActionFilter);
  const result = await api(`/audit-log?${query.toString()}`);

  content.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Audit Log</h2>
        <p>Immutable, append-only record of all administrative operations, logins, and student requests.</p>
      </div>
      <div class="toolbar">
        <button class="button button-quiet button-small" id="download-audit-csv" type="button">Export Audit CSV</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Audit Records</h3>
        <span class="table-secondary">${result.pagination.total} entries</span>
      </div>
      <div class="panel-body" style="padding-bottom:0">
        <div class="toolbar">
          <select class="select" id="filter-audit-module" style="width:170px">
            <option value="" ${!state.auditModuleFilter ? 'selected' : ''}>All Modules</option>
            ${state.modules.map(m => `<option value="${escapeHtml(m)}" ${state.auditModuleFilter === m ? 'selected' : ''}>${escapeHtml(moduleNames[m] || m)}</option>`).join('')}
          </select>
          <select class="select" id="filter-audit-action" style="width:140px">
            <option value="" ${!state.auditActionFilter ? 'selected' : ''}>All Actions</option>
            <option value="create" ${state.auditActionFilter === 'create' ? 'selected' : ''}>Create</option>
            <option value="update" ${state.auditActionFilter === 'update' ? 'selected' : ''}>Update</option>
            <option value="delete" ${state.auditActionFilter === 'delete' ? 'selected' : ''}>Delete</option>
            <option value="approved" ${state.auditActionFilter === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="denied" ${state.auditActionFilter === 'denied' ? 'selected' : ''}>Denied</option>
            <option value="cancel" ${state.auditActionFilter === 'cancel' ? 'selected' : ''}>Cancel</option>
            <option value="done" ${state.auditActionFilter === 'done' ? 'selected' : ''}>Done</option>
            <option value="rejected" ${state.auditActionFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
            <option value="login" ${state.auditActionFilter === 'login' ? 'selected' : ''}>Login</option>
            <option value="login_failed" ${state.auditActionFilter === 'login_failed' ? 'selected' : ''}>Login Failed</option>
            <option value="login_denied" ${state.auditActionFilter === 'login_denied' ? 'selected' : ''}>Login Denied</option>
          </select>
          ${state.auditModuleFilter || state.auditActionFilter ? '<button class="button button-quiet button-small" id="clear-audit-filter">Reset Filters</button>' : ''}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Module</th>
              <th>Action</th>
              <th>Summary</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${result.items.length ? result.items.map(entry => `
              <tr>
                <td style="white-space:nowrap;font-family:'DM Mono',monospace;font-size:10px">
                  ${escapeHtml(new Date(entry.createdAt).toLocaleString())}
                </td>
                <td>
                  <span class="table-primary">${escapeHtml(entry.actorEmail || 'System')}</span>
                  <span class="table-secondary">${escapeHtml(entry.ipAddress || '')}</span>
                </td>
                <td>
                  <span class="status" style="font-size:9px">${escapeHtml(moduleNames[entry.module] || entry.module)}</span>
                </td>
                <td>
                  <span class="table-primary" style="font-family:'DM Mono',monospace;font-size:10px">${escapeHtml(entry.action)}</span>
                </td>
                <td>
                  <span class="table-primary">${escapeHtml(entry.summary)}</span>
                  ${entry.recordId ? `<span class="table-secondary">Record: ${escapeHtml(entry.recordId)}</span>` : ''}
                </td>
                <td>
                  ${(entry.before || entry.after) ? `<button class="button button-quiet button-small" data-inspect-audit="${escapeHtml(entry.id)}">Inspect JSON</button>` : '<span class="table-secondary">—</span>'}
                </td>
              </tr>
            `).join('') : '<tr><td colspan="6"><div class="empty">No audit records match the filter.</div></td></tr>'}
          </tbody>
        </table>
      </div>
      ${result.pagination.pageCount > 1 ? `
        <div class="panel-head" style="justify-content:flex-end;gap:8px">
          <button class="button button-quiet button-small" id="audit-prev" ${result.pagination.page <= 1 ? 'disabled' : ''}>Previous</button>
          <span style="font-size:11px;color:var(--muted);align-self:center">Page ${result.pagination.page} of ${result.pagination.pageCount}</span>
          <button class="button button-quiet button-small" id="audit-next" ${result.pagination.page >= result.pagination.pageCount ? 'disabled' : ''}>Next</button>
        </div>
      ` : ''}
    </div>
  `;

  document.querySelector('#filter-audit-module')?.addEventListener('change', async event => {
    state.auditModuleFilter = event.target.value;
    state.auditPage = 1;
    await loadAuditView(content);
  });
  document.querySelector('#filter-audit-action')?.addEventListener('change', async event => {
    state.auditActionFilter = event.target.value;
    state.auditPage = 1;
    await loadAuditView(content);
  });
  document.querySelector('#clear-audit-filter')?.addEventListener('click', async () => {
    state.auditModuleFilter = '';
    state.auditActionFilter = '';
    state.auditPage = 1;
    await loadAuditView(content);
  });
  document.querySelector('#audit-prev')?.addEventListener('click', async () => {
    state.auditPage = Math.max(1, state.auditPage - 1);
    await loadAuditView(content);
  });
  document.querySelector('#audit-next')?.addEventListener('click', async () => {
    state.auditPage++;
    await loadAuditView(content);
  });
  document.querySelector('#download-audit-csv')?.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/v1/audit-log/export.csv', {
        headers: { 'ngrok-skip-browser-warning': 'true', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) },
      });
      if (!response.ok) {
        const errorResult = await response.json().catch(() => null);
        throw new Error(errorResult?.error?.message || `Could not export audit log (${response.status}).`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'audit-log.csv';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { showToast(error.message || 'Could not download audit log.', true); }
  });

  content.querySelectorAll('[data-inspect-audit]').forEach(button => button.addEventListener('click', () => {
    const entry = result.items.find(e => e.id === button.dataset.inspectAudit);
    if (entry) showAuditDiffDialog(entry);
  }));
}

function showAuditDiffDialog(entry) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  backdrop.innerHTML = `
    <section class="dialog" role="dialog" aria-modal="true" style="width:min(640px, 100%)">
      <div class="dialog-head">
        <h2>Audit Record Inspection</h2>
        <button class="button button-quiet button-small" data-close>Close</button>
      </div>
      <div class="dialog-body">
        <div style="font-size:12px;background:#f5f7f3;padding:10px;border-radius:4px">
          <strong>${escapeHtml(entry.summary)}</strong><br />
          <span style="color:var(--muted)">Module: ${escapeHtml(entry.module)} &middot; Action: ${escapeHtml(entry.action)} &middot; ${escapeHtml(new Date(entry.createdAt).toLocaleString())}</span>
        </div>
        ${entry.before ? `
          <div class="field">
            <span class="field-label">Before State:</span>
            <pre class="credential" style="max-height:200px;overflow:auto">${escapeHtml(JSON.stringify(entry.before, null, 2))}</pre>
          </div>
        ` : ''}
        ${entry.after ? `
          <div class="field">
            <span class="field-label">After State:</span>
            <pre class="credential" style="max-height:200px;overflow:auto">${escapeHtml(JSON.stringify(entry.after, null, 2))}</pre>
          </div>
        ` : ''}
      </div>
      <div class="dialog-actions">
        <button class="button button-primary" type="button" data-close>Close</button>
      </div>
    </section>
  `;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
}

function can(module, action) {
  if (state.user?.roleKey === 'local_development') return true;
  if (state.user?.roleKey === 'super_admin') return true;
  return state.permissions.some(permission => permission.module === module && permission.action === action);
}

function debounce(callback, delay) {
  let timeout;
  return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => callback(...args), delay); };
}

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const accountDropdown = document.querySelector('#account-dropdown');
  const accountToggle = document.querySelector('#account-menu-toggle');
  if (accountDropdown && accountToggle && !event.target.closest('.account-menu')) {
    accountDropdown.hidden = true;
    accountToggle.setAttribute('aria-expanded', 'false');
  }
  const dropdown = document.querySelector('#notification-dropdown');
  const toggle = document.querySelector('#notification-toggle');
  if (dropdown && toggle && !event.target.closest('.notification-menu')) {
    dropdown.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }
});

const backToTop = document.querySelector('#back-to-top');
const updateBackToTopVisibility = () => {
  if (backToTop) backToTop.hidden = window.scrollY < 240;
};
window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
updateBackToTopVisibility();

loadUser();

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'NU LIRC API',
    version: '1.0.0',
    description: 'Versioned API for the NU LIRC library system.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Envelope: {
        type: 'object',
        required: ['success', 'data', 'error'],
        properties: {
          success: { type: 'boolean' },
          data: { type: ['object', 'array', 'string', 'null'] },
          error: { type: ['object', 'null'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Check server health and version',
        responses: { 200: { description: 'Server is available.' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Sign in with a university email and password',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Signed in.' }, 401: { description: 'Invalid credentials.' }, 403: { description: 'Email domain is not allowed.' } },
      },
    },
    '/auth/refresh': {
      post: { summary: 'Rotate a refresh token', responses: { 200: { description: 'Tokens rotated.' }, 401: { description: 'Refresh token is invalid or expired.' } } },
    },
    '/auth/me': {
      get: { security: [{ bearerAuth: [] }], summary: 'Get the signed-in user and current permissions', responses: { 200: { description: 'Current user context.' } } },
    },
    '/auth/change-password': {
      post: { security: [{ bearerAuth: [] }], summary: 'Change a password and revoke prior sessions', responses: { 200: { description: 'Password changed and tokens rotated.' } } },
    },
    '/auth/logout': {
      post: { security: [{ bearerAuth: [] }], summary: 'Revoke the current session', responses: { 200: { description: 'Session revoked.' } } },
    },
    '/audit-log': {
      get: { security: [{ bearerAuth: [] }], summary: 'Read the immutable audit log (requires audit_log:read)', responses: { 200: { description: 'Paginated audit entries.' }, 403: { description: 'Permission denied.' } } },
    },
    '/admin/roles': {
      get: { security: [{ bearerAuth: [] }], summary: 'List roles (Super Admin)', responses: { 200: { description: 'Roles and assigned-user counts.' } } },
      post: { security: [{ bearerAuth: [] }], summary: 'Create a role and permission matrix (Super Admin)', responses: { 201: { description: 'Created role.' } } },
    },
    '/admin/roles/{roleId}': {
      get: { security: [{ bearerAuth: [] }], summary: 'Read role permissions (Super Admin)', parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Role detail.' } } },
      put: { security: [{ bearerAuth: [] }], summary: 'Update role permissions (Super Admin)', parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated role.' }, 409: { description: 'Duplicate role name.' } } },
      delete: { security: [{ bearerAuth: [] }], summary: 'Delete an unused custom role (Super Admin)', parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted role.' }, 409: { description: 'Role is assigned to users.' } } },
    },
    '/admin/users': {
      get: { security: [{ bearerAuth: [] }], summary: 'Search and paginate staff accounts (Super Admin)', responses: { 200: { description: 'Paginated staff directory.' } } },
      post: { security: [{ bearerAuth: [] }], summary: 'Create a staff account (Super Admin)', responses: { 201: { description: 'Created user and one-time activation credential.' }, 403: { description: 'Email domain is not allowed.' } } },
    },
    '/books': {
      get: { summary: 'Search the library catalog', parameters: [{ in: 'query', name: 'query', schema: { type: 'string' } }, { in: 'query', name: 'category', schema: { type: 'string' } }, { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } }], responses: { 200: { description: 'Ranked, paginated books.' } } },
      post: { security: [{ bearerAuth: [] }], summary: 'Create a catalog book (requires books:write)', responses: { 201: { description: 'Created book.' }, 409: { description: 'Duplicate title/author/ISBN.' } } },
    },
    '/books/{bookId}': {
      get: { summary: 'Get a catalog book', parameters: [{ in: 'path', name: 'bookId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Book detail.' } } },
      put: { security: [{ bearerAuth: [] }], summary: 'Update a book with optimistic version checking', parameters: [{ in: 'path', name: 'bookId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated book.' }, 409: { description: 'Version conflict.' } } },
      delete: { security: [{ bearerAuth: [] }], summary: 'Delete a book (requires books:delete)', parameters: [{ in: 'path', name: 'bookId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted book.' }, 403: { description: 'Permission denied.' } } },
    },
    '/books/categories': { get: { summary: 'List book categories', responses: { 200: { description: 'Paginated book categories.' } } }, post: { security: [{ bearerAuth: [] }], summary: 'Create a book category', responses: { 201: { description: 'Created category.' } } } },
    '/books/export.csv': { get: { security: [{ bearerAuth: [] }], summary: 'Export catalog as CSV', responses: { 200: { description: 'CSV file.' } } } },
    '/books/import.csv': { post: { security: [{ bearerAuth: [] }], summary: 'Import catalog rows from CSV', requestBody: { required: true, content: { 'text/csv': { schema: { type: 'string' } } } }, responses: { 200: { description: 'Import summary with invalid rows.' } } } },
    '/clippings': {
      get: { summary: 'List newspaper clippings with date/topic filters', responses: { 200: { description: 'Paginated clipping archive.' } } },
      post: { security: [{ bearerAuth: [] }], summary: 'Upload a clipping with JPG, PNG, WebP, or PDF files', requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { date: { type: 'string', format: 'date' }, topic: { type: 'string' }, newspaperName: { type: 'string' }, files: { type: 'array', items: { type: 'string', format: 'binary' } } } } } } }, responses: { 201: { description: 'Created clipping.' }, 415: { description: 'Invalid upload type/signature.' } } },
    },
    '/general-info': {
      get: { summary: 'Get library rules, weekly timings, and contact details', responses: { 200: { description: 'Current information or an empty document.' } } },
      put: { security: [{ bearerAuth: [] }], summary: 'Update rules, timings, and contact details', responses: { 200: { description: 'Updated information.' }, 409: { description: 'Version conflict.' } } },
    },
    '/holidays': { get: { summary: 'List holiday hours', responses: { 200: { description: 'Paginated holiday schedule.' } } }, post: { security: [{ bearerAuth: [] }], summary: 'Create a holiday schedule entry', responses: { 201: { description: 'Created holiday.' } } } },
    '/e-resources': { get: { summary: 'List e-resources', responses: { 200: { description: 'Paginated links.' } } }, post: { security: [{ bearerAuth: [] }], summary: 'Create an e-resource link', responses: { 201: { description: 'Created e-resource.' } } } },
    '/e-resources/categories': { get: { summary: 'List e-resource categories', responses: { 200: { description: 'Categories.' } } }, post: { security: [{ bearerAuth: [] }], summary: 'Create an e-resource category', responses: { 201: { description: 'Created category.' } } } },
    '/announcements': { get: { summary: 'List published announcements', responses: { 200: { description: 'Paginated notices.' } } }, post: { security: [{ bearerAuth: [] }], summary: 'Create an announcement', responses: { 201: { description: 'Created announcement.' } } } },
    '/rooms': {
      get: { security: [{ bearerAuth: [] }], summary: 'List discussion rooms', responses: { 200: { description: 'Rooms list.' } } },
      post: { security: [{ bearerAuth: [] }], summary: 'Create discussion room', responses: { 201: { description: 'Created room.' } } },
    },
    '/rooms/availability': {
      get: { security: [{ bearerAuth: [] }], summary: 'Get room availability and approved bookings for a date', parameters: [{ in: 'query', name: 'roomId', required: true, schema: { type: 'string' } }, { in: 'query', name: 'date', required: true, schema: { type: 'string', format: 'date' } }], responses: { 200: { description: 'Approved bookings.' } } },
    },
    '/rooms/{roomId}': {
      put: { security: [{ bearerAuth: [] }], summary: 'Update discussion room', parameters: [{ in: 'path', name: 'roomId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated room.' } } },
      delete: { security: [{ bearerAuth: [] }], summary: 'Delete discussion room if no bookings exist', parameters: [{ in: 'path', name: 'roomId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted room.' } } },
    },
    '/room-requests': {
      get: { security: [{ bearerAuth: [] }], summary: 'List room requests with conflicts and filters', parameters: [{ in: 'query', name: 'status', schema: { type: 'string' } }, { in: 'query', name: 'roomId', schema: { type: 'string' } }, { in: 'query', name: 'date', schema: { type: 'string' } }, { in: 'query', name: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'Paginated room requests with conflict lists.' } } },
      post: { security: [{ bearerAuth: [] }], summary: 'Create room request with Idempotency-Key', parameters: [{ in: 'header', name: 'Idempotency-Key', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Created room request.' } } },
    },
    '/room-requests/mine': {
      get: { security: [{ bearerAuth: [] }], summary: "Get current student's room requests", responses: { 200: { description: 'My room requests.' } } },
    },
    '/room-requests/export.csv': {
      get: { security: [{ bearerAuth: [] }], summary: 'Export room requests as CSV', responses: { 200: { description: 'CSV file.' } } },
    },
    '/room-requests/{requestId}/cancel': {
      patch: { security: [{ bearerAuth: [] }], summary: 'Cancel own room request', parameters: [{ in: 'path', name: 'requestId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cancelled.' } } },
    },
    '/room-requests/{requestId}/decision': {
      patch: { security: [{ bearerAuth: [] }], summary: 'Approve or deny room request with conflict check', parameters: [{ in: 'path', name: 'requestId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Decided.' }, 409: { description: 'Conflict detected without overrideReason.' } } },
    },
    '/book-requests': {
      get: { security: [{ bearerAuth: [] }], summary: 'List book requests queue and history', responses: { 200: { description: 'Paginated book requests.' } } },
      post: { security: [{ bearerAuth: [] }], summary: 'Submit a book request with Idempotency-Key', parameters: [{ in: 'header', name: 'Idempotency-Key', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Created book request.' } } },
    },
    '/book-requests/mine': {
      get: { security: [{ bearerAuth: [] }], summary: "Get current student's book requests", responses: { 200: { description: 'My book requests.' } } },
    },
    '/book-requests/export.csv': {
      get: { security: [{ bearerAuth: [] }], summary: 'Export book requests as CSV', responses: { 200: { description: 'CSV file.' } } },
    },
    '/book-requests/{requestId}/decision': {
      patch: { security: [{ bearerAuth: [] }], summary: 'Mark book request done or rejected with optional quantity decrement', parameters: [{ in: 'path', name: 'requestId', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Decided.' } } },
    },
    '/updates/stream': {
      get: { summary: 'Server-Sent Events (SSE) live updates stream', responses: { 200: { description: 'SSE event stream.' } } },
    },
    '/sync': {
      get: { security: [{ bearerAuth: [] }], summary: 'Delta refresh endpoint returning changes since timestamp', parameters: [{ in: 'query', name: 'since', schema: { type: 'string', format: 'date-time' } }], responses: { 200: { description: 'Delta changes list.' } } },
    },
    '/dashboard/stats': {
      get: { security: [{ bearerAuth: [] }], summary: 'Live library statistics, counts, weekly charts, and recent activity', responses: { 200: { description: 'Dashboard stats and activity feed.' } } },
    },
    '/audit-log/export.csv': {
      get: { security: [{ bearerAuth: [] }], summary: 'Export immutable audit log as CSV', responses: { 200: { description: 'CSV file.' } } },
    },
  },
};
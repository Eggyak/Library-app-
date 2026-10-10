/**
 * Concurrency test script
 * Tests 50 simultaneous room requests and conflicting approvals
 */

import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = resolve(__dirname, '../data/library.db');

const SERVER_URL = 'http://localhost:3000/api/v1';

function makeRequest(path, options = {}) {
  return new Promise((resolve_fn, reject) => {
    const options2 = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = http.request(options2, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve_fn({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve_fn({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runConcurrencyTests() {
  console.log('='.repeat(60));
  console.log('NU LIRC Concurrency Tests');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.log(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Check if server is running
  console.log('\n0. Checking server availability...');
  try {
    const health = await makeRequest('/health');
    if (health.status === 200) {
      console.log('  [PASS] Server is running');
      passed++;
    } else {
      console.log('  [FAIL] Server health check failed');
      failed++;
    }
  } catch (e) {
    console.log('  [FAIL] Server not reachable: ' + e.message);
    console.log('         Start the server first: start-server.bat');
    return { passed, failed };
  }

  // Test 1: 50 simultaneous room requests
  console.log('\n1. Testing 50 simultaneous room requests...');
  const roomRes = await makeRequest('/rooms');
  const rooms = roomRes.data?.items || [];
  if (rooms.length === 0) {
    console.log('  [SKIP] No rooms available for testing');
    return { passed, failed: failed + 1 };
  }
  const room = rooms[0];

  const roomRequests = [];
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push((async () => {
      const reqRes = await makeRequest('/room-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `test_req_${i}`
        },
        body: {
          roomId: room.id,
          date: '2025-07-15',
          startTime: '10:00',
          endTime: '11:00',
          purpose: `Load test request ${i}`,
          groupSize: 4
        }
      });
      return reqRes;
    })());
  }

  const results = await Promise.all(promises);
  const savedRequests = results.filter(r => r.status === 200 || r.status === 201);
  const rejectedRequests = results.filter(r => r.status !== 200 && r.status !== 201);
  const duplicateSubmissions = savedRequests.filter(r => r.data?.duplicateSubmission === true);

  assert(savedRequests.length === 50, `All 50 requests saved (got ${savedRequests.length})`);
  assert(duplicateSubmissions.length === 0, `No duplicate submissions detected`);
  assert(rejectedRequests.length === 0, `No unexpected rejections`);

  // Verify all 50 are in the database
  const db = new Database(dbPath);
  const count = db.prepare("SELECT COUNT(*) as cnt FROM room_requests WHERE purpose LIKE 'Load test request%'").get();
  assert(count.cnt === 50, `All 50 requests found in database (got ${count.cnt})`);
  db.close();

  // Test 2: Simultaneous conflicting approvals
  console.log('\n2. Testing simultaneous conflicting approvals...');
  const pendingRes = await makeRequest('/room-requests?status=pending&pageSize=100');
  const pendingRequests = pendingRes.data?.items || [];

  if (pendingRequests.length >= 2) {
    // Try to approve 2 overlapping requests simultaneously
    const req1 = pendingRequests[0];
    const req2 = pendingRequests.find(r =>
      r.roomId === req1.roomId &&
      r.startTime === req1.startTime &&
      r.endTime === req1.endTime &&
      r.date === req1.date &&
      r.id !== req1.id
    );

    if (req2) {
      const approvePromises = [];
      for (const req of [req1, req2]) {
        approvePromises.push(makeRequest(`/room-requests/${req.id}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: { }
        }));
      }

      const approveResults = await Promise.all(approvePromises);
      const approved = approveResults.filter(r => r.status === 200);
      const conflicts = approveResults.filter(r => r.status === 409);

      assert(approved.length >= 1, `At least one approval succeeded (got ${approved.length})`);
      assert(conflicts.length >= 1, `At least one conflict was detected (got ${conflicts.length})`);

      // Verify only one was actually approved
      const db2 = new Database(dbPath);
      const approvedCount = db2.prepare(`
        SELECT COUNT(*) as cnt FROM room_requests
        WHERE room_id = ? AND date = ? AND start_time = ? AND end_time = ? AND status = 'approved'
      `).get(req1.roomId, req1.date, req1.startTime, req1.endTime);
      assert(approvedCount.cnt === 1, `Only one overlapping booking was approved (got ${approvedCount.cnt})`);
      db2.close();
    } else {
      console.log('  [SKIP] No overlapping pending requests found');
    }
  } else {
    console.log('  [SKIP] Not enough pending requests for conflict test');
  }

  // Test 3: Idempotency - duplicate submission should return 200 with duplicateSubmission flag
  console.log('\n3. Testing idempotency...');
  const idempotencyKey = `idempotency_test_${Date.now()}`;
  const firstRes = await makeRequest('/room-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: {
      roomId: room.id,
      date: '2025-07-20',
      startTime: '14:00',
      endTime: '15:00',
      purpose: 'Idempotency test',
      groupSize: 2
    }
  });
  const secondRes = await makeRequest('/room-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: {
      roomId: room.id,
      date: '2025-07-20',
      startTime: '14:00',
      endTime: '15:00',
      purpose: 'Idempotency test',
      groupSize: 2
    }
  });

  assert(firstRes.status === 200 || firstRes.status === 201, `First request created (got ${firstRes.status})`);
  assert(secondRes.status === 200, `Duplicate request returns 200 (got ${secondRes.status})`);
  assert(secondRes.data?.duplicateSubmission === true, `Duplicate detected with flag`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Concurrency Tests: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  return { passed, failed };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runConcurrencyTests().then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

export { runConcurrencyTests };
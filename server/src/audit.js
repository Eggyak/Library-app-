import { broadcastChange } from './realtime.js';

export function recordAudit(database, {
  actorUserId = null,
  actorEmail = null,
  action,
  module,
  recordId = null,
  summary,
  ipAddress = null,
  before = null,
  after = null,
}) {
  const timestamp = new Date().toISOString();
  database.prepare(`
    INSERT INTO audit_log (
      actor_user_id, actor_email, action, module, record_id, summary,
      ip_address, before_json, after_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    actorUserId,
    actorEmail,
    action,
    module,
    recordId,
    summary,
    ipAddress,
    before === null ? null : JSON.stringify(before),
    after === null ? null : JSON.stringify(after),
    timestamp,
  );

  try {
    broadcastChange({ module, action, recordId, summary, timestamp });
  } catch {
    // Non-blocking if broadcast encounters an issue
  }
}
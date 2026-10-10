ALTER TABLE books ADD COLUMN is_new_arrival INTEGER NOT NULL DEFAULT 0 CHECK (is_new_arrival IN (0, 1));
ALTER TABLE books ADD COLUMN arrival_date TEXT;
CREATE INDEX books_new_arrivals ON books(is_new_arrival, arrival_date DESC);

INSERT OR IGNORE INTO role_permissions (role_id, module, action, allowed)
SELECT id, 'new_arrivals', action, CASE WHEN system_key = 'staff' AND action IN ('read', 'write', 'update') THEN 1 ELSE 0 END
FROM roles
CROSS JOIN (SELECT 'read' AS action UNION ALL SELECT 'write' UNION ALL SELECT 'update' UNION ALL SELECT 'delete');

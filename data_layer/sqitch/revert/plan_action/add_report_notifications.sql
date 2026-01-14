-- Revert tet:plan_action/add_report_notifications from pg

BEGIN;

ALTER TABLE notifications.notification
DROP CONSTRAINT IF EXISTS notification_notified_on_check;

ALTER TABLE notifications.notification
DROP COLUMN IF EXISTS send_after;

ALTER TABLE plan_report_generation
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS collectivite_id,
DROP COLUMN IF EXISTS name;

COMMIT;

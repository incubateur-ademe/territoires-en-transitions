-- Revert tet:plan_action/add_report_notifications from pg

BEGIN;

ALTER TABLE notifications.notification
DROP CONSTRAINT IF EXISTS notification_notified_on_check;

ALTER TABLE notifications.notification
ADD CONSTRAINT notification_notified_on_check
CHECK (notified_on IN ('update_fiche_pilote'));

ALTER TABLE notifications.notification
DROP COLUMN IF EXISTS send_after;

ALTER TABLE plan_report_generation
DROP COLUMN IF EXISTS created_by;

ALTER TABLE plan_report_generation
DROP COLUMN IF EXISTS name;

COMMIT;

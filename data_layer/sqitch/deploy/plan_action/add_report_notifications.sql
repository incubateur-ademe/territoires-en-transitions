-- Deploy tet:plan_action/add_report_notifications to pg

BEGIN;

ALTER TABLE notifications.notification
DROP CONSTRAINT IF EXISTS notification_notified_on_check;

ALTER TABLE notifications.notification
ADD CONSTRAINT notification_notified_on_check
CHECK (notified_on IN ('update_fiche_pilote', 'generate_plan_report_completed', 'generate_plan_report_failed'));

ALTER TABLE notifications.notification
ADD COLUMN IF NOT EXISTS send_after TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE plan_report_generation
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE plan_report_generation
ADD COLUMN IF NOT EXISTS name TEXT;

COMMIT;

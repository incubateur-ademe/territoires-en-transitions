-- Deploy tet:plan_action/add_report_notifications to pg

BEGIN;

ALTER TABLE notifications.notification
DROP CONSTRAINT IF EXISTS notification_notified_on_check;

ALTER TABLE notifications.notification
ADD COLUMN IF NOT EXISTS send_after TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE plan_report_generation
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS collectivite_id INTEGER REFERENCES collectivite(id),
ADD COLUMN IF NOT EXISTS name TEXT;

COMMIT;

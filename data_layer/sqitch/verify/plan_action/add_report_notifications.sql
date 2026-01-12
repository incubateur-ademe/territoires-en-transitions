-- Verify tet:plan_action/add_report_notifications on pg

BEGIN;

SELECT send_after
FROM notifications.notification
WHERE false;

SELECT created_by,
name,
collectivite_id
FROM plan_report_generation
WHERE false;

ROLLBACK;

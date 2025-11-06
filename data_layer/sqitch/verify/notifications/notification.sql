-- Verify tet:notifications/notification on pg

BEGIN;

select
  id,
  entity_id
  status,
  send_to,
  sent_at,
  sent_to_email,
  error_message,
  retries,
  created_by,
  created_at,
  notified_on,
  notification_data
from notifications.notification
where false;

ROLLBACK;

-- Revert tet:notifications/notification from pg

BEGIN;

drop table if exists notifications.notification;

drop schema if exists notifications;

COMMIT;


-- Revert tet:webkooks/webhooks from pg

BEGIN;

drop table if exists webhooks.webhook_message;

drop table if exists webhooks.webhook_configuration;

drop schema if exists webhooks;

COMMIT;

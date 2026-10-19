-- Revert tet:webhooks/outbox from pg

BEGIN;

LOCK TABLE nest_outbox.messages, nest_outbox.dead_letters, nest_outbox.inbox IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM nest_outbox.messages)
    OR EXISTS (SELECT 1 FROM nest_outbox.dead_letters)
    OR EXISTS (SELECT 1 FROM nest_outbox.inbox) THEN
    RAISE EXCEPTION 'Stop producers and drain the outbox, dead letters and inbox before reverting';
  END IF;
END $$;

DROP TABLE nest_outbox.messages;
DROP TABLE nest_outbox.dead_letters;
DROP TABLE nest_outbox.inbox;
DROP TABLE nest_outbox.migrations;
DROP SCHEMA nest_outbox;

COMMIT;

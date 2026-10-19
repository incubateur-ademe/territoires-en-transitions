-- Verify tet:webhooks/outbox on pg

BEGIN;

DO $$
DECLARE
  relation_name text;
BEGIN
  IF (SELECT max(version) FROM nest_outbox.migrations) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Unexpected outbox schema version';
  END IF;
  FOREACH relation_name IN ARRAY ARRAY['migrations', 'messages', 'dead_letters', 'inbox'] LOOP
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = ('nest_outbox.' || relation_name)::regclass) THEN
      RAISE EXCEPTION 'RLS must protect nest_outbox.%', relation_name;
    END IF;
    IF has_table_privilege('anon', 'nest_outbox.' || relation_name, 'SELECT')
      OR has_table_privilege('authenticated', 'nest_outbox.' || relation_name, 'SELECT') THEN
      RAISE EXCEPTION 'Outbox tables must not be exposed to application clients';
    END IF;
    IF NOT has_table_privilege('service_role', 'nest_outbox.' || relation_name, 'SELECT') THEN
      RAISE EXCEPTION 'Missing service_role access to nest_outbox.%', relation_name;
    END IF;
  END LOOP;
  IF has_schema_privilege('anon', 'nest_outbox', 'USAGE') OR has_schema_privilege('authenticated', 'nest_outbox', 'USAGE') THEN
    RAISE EXCEPTION 'Outbox schema must remain private';
  END IF;
END $$;

SELECT seq, id, topic, payload, headers, key, created_at, available_at,
       attempts, last_error, history, lease_owner, lease_until
FROM nest_outbox.messages WHERE false;
SELECT id, seq, topic, payload, headers, key, created_at, attempts,
       last_error, history, reason, failed_at
FROM nest_outbox.dead_letters WHERE false;
SELECT consumer, message_id, processed_at FROM nest_outbox.inbox WHERE false;

ROLLBACK;

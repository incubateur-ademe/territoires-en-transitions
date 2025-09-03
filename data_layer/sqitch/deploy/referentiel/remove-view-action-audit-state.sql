-- Deploy tet:2025-07-22-remove-view-action-audit-state to pg

BEGIN;

DROP VIEW IF EXISTS suivi_audit;
DROP TRIGGER IF EXISTS upsert ON public.action_audit_state;
DROP FUNCTION IF EXISTS labellisation.upsert_action_audit();
DROP VIEW IF EXISTS action_audit_state;

COMMIT;

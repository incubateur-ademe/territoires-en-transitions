-- Revert tet:collectivite/preuve_rls_insert_serveur from pg

BEGIN;

drop policy if exists deny_insert_client on preuve_audit;
drop policy if exists deny_insert_client on preuve_rapport;

COMMIT;

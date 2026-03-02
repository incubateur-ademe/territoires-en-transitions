-- Revert tet:migration/etape_to_sous_action from pg

BEGIN;

drop table if exists migration.etape_to_sous_action;

COMMIT;

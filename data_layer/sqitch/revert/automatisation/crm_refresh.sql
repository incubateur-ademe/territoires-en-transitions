-- Revert tet:automatisation/crm_refresh from pg

BEGIN;

drop function stats.refresh_views_crm;

COMMIT;

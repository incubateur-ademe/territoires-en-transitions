-- Revert tet:plan_action/fiche_action_indicateur_add_audit_columns from pg

BEGIN;

alter table public.fiche_action_indicateur
    drop column created_at,
    drop column created_by;

COMMIT;

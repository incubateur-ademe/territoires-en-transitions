-- Revert tet:plan_action/fiche_action_axe_add_audit_columns from pg

BEGIN;

alter table public.fiche_action_axe
    drop column created_at,
    drop column created_by,
    drop column modified_at,
    drop column modified_by;

COMMIT;

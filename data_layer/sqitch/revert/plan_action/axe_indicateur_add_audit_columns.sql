-- Revert tet:plan_action/axe_indicateur_add_audit_columns from pg

BEGIN;

alter table public.axe_indicateur
    drop column created_at,
    drop column created_by,
    drop column modified_at,
    drop column modified_by;

COMMIT;

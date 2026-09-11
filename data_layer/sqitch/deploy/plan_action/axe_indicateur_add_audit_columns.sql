-- Deploy tet:plan_action/axe_indicateur_add_audit_columns to pg
-- requires: plan_action/axe_indicateur

BEGIN;

alter table public.axe_indicateur
    add column created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    add column created_by  uuid references auth.users default auth.uid(),
    add column modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    add column modified_by uuid references auth.users default auth.uid();

COMMIT;

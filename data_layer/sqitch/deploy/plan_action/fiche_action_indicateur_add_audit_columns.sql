-- Deploy tet:plan_action/fiche_action_indicateur_add_audit_columns to pg
-- requires: plan_action/plan_action

BEGIN;

alter table public.fiche_action_indicateur
    add column created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    add column created_by  uuid references auth.users not null;

COMMIT;

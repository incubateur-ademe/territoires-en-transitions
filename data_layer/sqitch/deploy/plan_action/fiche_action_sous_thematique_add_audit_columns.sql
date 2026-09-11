-- Deploy tet:plan_action/fiche_action_sous_thematique_add_audit_columns to pg
-- requires: plan_action/plan_action

BEGIN;

alter table public.fiche_action_sous_thematique
    add column created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    add column created_by  uuid references auth.users default auth.uid(),
    add column modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    add column modified_by uuid references auth.users default auth.uid();

COMMIT;

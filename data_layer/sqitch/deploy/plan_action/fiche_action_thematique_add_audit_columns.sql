-- Deploy tet:plan_action/fiche_action_thematique_add_audit_columns to pg
-- requires: plan_action/plan_action

BEGIN;

-- Colonnes nullables : on ne sait pas qui a créé les lignes existantes ni
-- quand, elles restent à null plutôt que de porter la date de la migration.
alter table public.fiche_action_thematique
    add column created_at  timestamp with time zone,
    add column created_by  uuid references auth.users;

-- created_by est posé par l'application (pas de défaut auth.uid(), toujours
-- null sous connexion Drizzle). NOT VALID : la contrainte s'impose à toute
-- nouvelle ligne sans être vérifiée sur les lignes historiques.
alter table public.fiche_action_thematique
    alter column created_at set default CURRENT_TIMESTAMP,
    add constraint fiche_action_thematique_created_by_not_null check (created_by is not null) not valid;

COMMIT;

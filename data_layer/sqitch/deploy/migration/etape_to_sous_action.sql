-- Deploy tet:migration/etape_to_sous_action to pg

BEGIN;

create table migration.etape_to_sous_action
(
  etape_id       integer primary key references fiche_action_etape(id) on delete cascade,
  sous_action_id integer not null references fiche_action(id) on delete cascade,
  created_at     timestamp with time zone default current_timestamp not null
);

comment on table migration.etape_to_sous_action is
  'Lien entre une étape migrée et la sous-action créée (pour éviter les doublons)';

COMMIT;

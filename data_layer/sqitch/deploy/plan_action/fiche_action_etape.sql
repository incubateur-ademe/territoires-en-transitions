-- Deploy tet:plan_action/fiche_action_etape to pg

BEGIN;

create table fiche_action_etape
(
  id          serial primary key,
  fiche_id    integer references fiche_action on delete cascade                 not null,
  nom         text,
  ordre       integer                                                           not null,
  realise     boolean                  default false                            not null,
  modified_at timestamp with time zone default CURRENT_TIMESTAMP                not null,
  created_at  timestamp with time zone default CURRENT_TIMESTAMP                not null,
  modified_by uuid                     default auth.uid() references auth.users not null,
  created_by  uuid                     default auth.uid() references auth.users not null
);

comment on table fiche_action_etape is
  'Etapes (ou tâches) nécessaires à la réalisation de la fiche action';

alter table fiche_action_etape
  enable row level security;
create policy allow_read on fiche_action_etape for select using (peut_lire_la_fiche(fiche_id));
create policy allow_insert on fiche_action_etape for insert with check (peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_etape for update using (peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_etape for delete using (peut_modifier_la_fiche(fiche_id));

COMMIT;

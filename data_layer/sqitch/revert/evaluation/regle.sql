-- Deploy tet:evaluation/regle to pg
-- requires: referentiel/contenu
-- requires: utils/auth

BEGIN;


alter table personnalisation_regle
	drop constraint if exists personnalisation_regle_action_id_fkey;

create table personnalisation
(
    action_id   action_id primary key references action_relation,
    titre       text not null,
    description text not null
);
comment on table personnalisation is
    'How an action is personalized.';

alter table personnalisation
    enable row level security;
create policy allow_read_for_all on personnalisation for select using (true);

COMMIT;

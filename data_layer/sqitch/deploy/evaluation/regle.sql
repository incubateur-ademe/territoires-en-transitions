-- Deploy tet:evaluation/regle to pg

BEGIN;

alter table personnalisation_regle
	drop constraint if exists personnalisation_regle_action_id_fkey,
	add constraint personnalisation_regle_action_id_fkey foreign key (action_id) references public.action_definition("action_id");

drop table if exists personnalisation;

COMMIT;

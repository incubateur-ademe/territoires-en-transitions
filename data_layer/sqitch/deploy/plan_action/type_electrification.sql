-- Deploy tet:plan_action/type_electrification to pg

BEGIN;

insert into plan_action_type (categorie, type)
values ('Plans thématiques', 'Plan Électrification')
on conflict (categorie, type) do nothing;

COMMIT;

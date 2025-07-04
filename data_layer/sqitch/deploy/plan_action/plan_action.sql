-- Deploy tet:plan_action to pg

BEGIN;

insert into plan_action_type (categorie, type)
values ('Plans thématiques', 'Plan de protection de l''atmosphère (incluant Plans qualité de l''air)');
on conflict (categorie, type) do nothing;

update plan_action_type
set type = 'Autre transverse'
where categorie = 'Plans transverses' and type = 'Autre';

update plan_action_type
set type = 'Autre thématique'
where categorie = 'Plans thématiques' and type = 'Autre';

COMMIT;
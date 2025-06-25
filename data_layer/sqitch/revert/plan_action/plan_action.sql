-- Revert tet:plan_action from pg

BEGIN;

-- Deletes newly added plan thématique
delete from plan_action_type
where categorie = 'Plans thématiques'
  and type = 'Plan de protection de l''atmosphère (incluant Plans qualité de l''air)';

-- Restores previous "Autre" names
update plan_action_type
set type = 'Autre'
where categorie = 'Plans transverses' and type = 'Autre transverse';

update plan_action_type
set type = 'Autre'
where categorie = 'Plans thématiques' and type = 'Autre thématique';

COMMIT;
-- Verify tet:plan_action on pg

BEGIN;

-- Checks that the new plan thématique has been added
select 1/count(*) from plan_action_type
where categorie = 'Plans thématiques'
  and type = 'Plan de protection de l''atmosphère (incluant Plans qualité de l''air)';

-- Checks that the previous "Autre" transverse have been renamed
select 1/count(*) from plan_action_type
where categorie = 'Plans transverses'
  and type = 'Autre transverse';

-- Checks that the previous "Autre" thématique have been renamed
select 1/count(*) from plan_action_type
where categorie = 'Plans thématiques'
  and type = 'Autre thématique';

ROLLBACK;

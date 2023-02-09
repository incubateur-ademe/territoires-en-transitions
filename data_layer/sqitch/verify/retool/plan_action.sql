-- Verify tet:retool/plan_action on pg

BEGIN;

select collectivite_id, nom, nb_plans, nb_fiches, derniere_modif, nb_utilisateurs
from retool_plan_action_usage
where false;

select collectivite_id, nom, date_range, nb_plans, nb_fiches
from retool_plan_action_hebdo
where false;

ROLLBACK;

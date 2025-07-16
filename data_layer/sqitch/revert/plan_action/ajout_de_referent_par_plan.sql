-- Revert tet:ajout_de_referent_par_plan from pg

BEGIN;

-- Drop the function
DROP FUNCTION IF EXISTS private.axe_collectivite_id(integer);

-- Drop the plan_referent table (this will also drop the index and constraints)
DROP TABLE IF EXISTS plan_referent;

COMMIT; 
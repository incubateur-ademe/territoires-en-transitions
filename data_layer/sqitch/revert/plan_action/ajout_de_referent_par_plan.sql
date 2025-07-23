-- Revert tet:ajout_de_referent_par_plan from pg

BEGIN;

-- Drop RLS policies first (they depend on the function)
DROP POLICY IF EXISTS allow_insert ON plan_referent;
DROP POLICY IF EXISTS allow_read ON plan_referent;
DROP POLICY IF EXISTS allow_update ON plan_referent;
DROP POLICY IF EXISTS allow_delete ON plan_referent;

-- Drop the function
DROP FUNCTION IF EXISTS private.axe_collectivite_id(integer);

-- Drop the plan_referent table (this will also drop the index and constraints)
DROP TABLE IF EXISTS plan_referent;

COMMIT; 
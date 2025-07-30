-- Revert tet:ajout_de_pilote_par_plan from pg

BEGIN;

-- Drop the plan_pilote table (this will also drop the index and constraints)
DROP TABLE IF EXISTS plan_pilote;

COMMIT; 
-- Revert tet:plan_action/add_report_generation_table from pg

BEGIN;

-- Drop the plan_report_generation table (this will also drop the constraints)
DROP TABLE IF EXISTS plan_report_generation;

COMMIT;

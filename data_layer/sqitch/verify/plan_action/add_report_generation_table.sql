-- Verify tet:plan_action/add_report_generation_table on pg

BEGIN;

SELECT 
    id,
    plan_id,
    template_ref,
    file_id,
    options,
    status,
    error_message,
    created_at,
    modified_at
FROM plan_report_generation
WHERE false;

ROLLBACK;

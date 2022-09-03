-- Verify tet:utils/modified_at_trigger on pg

BEGIN;

select has_function_privilege('private.add_modified_at_trigger(text, text)', 'execute');

ROLLBACK;

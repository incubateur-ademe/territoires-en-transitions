-- Verify tet:utils/modified_by on pg

BEGIN;

select has_function_privilege('enforce_modified_by()', 'execute');
select has_function_privilege('private.add_modified_by_trigger(text, text)', 'execute');

ROLLBACK;

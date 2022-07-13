-- Verify tet:utils/naturalsort on pg

BEGIN;

select has_function_privilege('naturalsort(text)', 'execute');

ROLLBACK;

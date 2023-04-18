-- Verify tet:labellisation/cot on pg

BEGIN;

select collectivite_id, actif, signataire
from cot
where false;

select has_function_privilege('before_insert_add_default_signataire()', 'execute');

ROLLBACK;

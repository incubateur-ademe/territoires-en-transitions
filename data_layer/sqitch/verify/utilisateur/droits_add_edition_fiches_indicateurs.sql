-- Verify tet:utilisateur/droits_add_edition_fiches_indicateurs on pg

BEGIN;

select has_function_privilege('have_edition_acces(integer)', 'execute');

ROLLBACK;

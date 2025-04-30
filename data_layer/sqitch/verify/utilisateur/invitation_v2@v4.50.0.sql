-- Verify tet:utilisateur/invitation_v2 on pg

BEGIN;

select has_function_privilege('consume_invitation(uuid)', 'execute');

ROLLBACK;

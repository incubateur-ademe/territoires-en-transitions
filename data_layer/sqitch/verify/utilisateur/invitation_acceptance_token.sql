-- Verify tet:utilisateur/invitation_acceptance_token on pg

BEGIN;

do $$
begin
    if has_column_privilege('anon', 'utilisateur.invitation', 'acceptance_token', 'SELECT')
        or has_column_privilege('authenticated', 'utilisateur.invitation', 'acceptance_token', 'SELECT')
    then
        raise exception 'Invitation acceptance tokens must not be readable by API roles';
    end if;
end;
$$;

ROLLBACK;

-- Deploy tet:utils/auth to pg

BEGIN;

create or replace function
    is_authenticated()
    returns boolean
as
$$
begin
    return auth.role() = 'authenticated';
end;
$$ language plpgsql;
comment on function is_authenticated is
    'Returns true if current user is authenticated.';


create or replace function
    is_service_role()
    returns boolean
as
$$
begin
    return auth.role() = 'service_role';
end;
$$ language plpgsql;
comment on function is_service_role is
    'Returns true if current user is the service role, that is using the secret key.';

COMMIT;

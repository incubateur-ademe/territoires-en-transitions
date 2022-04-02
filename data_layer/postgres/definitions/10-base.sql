create table abstract_modified_at
(
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
alter table abstract_modified_at
    enable row level security;

create function update_modified_at() returns trigger
as
$$
begin
    new.modified_at = now();
    return new;
end;
$$ language plpgsql;

create or replace function teapot() returns json as
$$
begin
    perform set_config('response.status', '418', true);
    return json_build_object('message', 'The requested entity body is short and stout.',
                             'hint', 'Tip it over and pour it out.');
end;
$$ language plpgsql;


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

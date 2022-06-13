-- Deploy tet:utils/teapot to pg

BEGIN;

create or replace function teapot() returns json as
$$
begin
    perform set_config('response.status', '418', true);
    return json_build_object('message', 'The requested entity body is short and stout.',
                             'hint', 'Tip it over and pour it out.');
end;
$$ language plpgsql;
comment on function teapot() is
 'Any attempt to brew coffee with a teapot should result in the error code "418 I''m a teapot".';

COMMIT;

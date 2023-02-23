-- Deploy tet:collectivites to pg
-- requires: base
-- requires: imports

BEGIN;

alter table collectivite
    add column access_restreint boolean default false not null;

create or replace function have_lecture_access_with_restreint(collectivite_id integer) returns boolean as $$
begin
    return (
        select case when coalesce((select access_restreint
                          from collectivite
                          where id = have_lecture_access_with_restreint.collectivite_id
                          limit 1), false)
                        then have_lecture_acces(have_lecture_access_with_restreint.collectivite_id)
                    else is_authenticated() end
    );

end;
$$language plpgsql;
comment on function have_lecture_access_with_restreint
    is 'Vrai si l''utilisateur a accès en lecture à la collectivité en prenant en compte la restriction access_restreint';

COMMIT;

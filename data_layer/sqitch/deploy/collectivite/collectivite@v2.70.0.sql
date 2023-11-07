-- Deploy tet:collectivites to pg
-- requires: base
-- requires: imports

BEGIN;

alter table collectivite
    add column access_restreint boolean default false not null;

create function can_read_acces_restreint(collectivite_id integer) returns boolean as $$
begin
    return (
        select case when (select access_restreint
                          from collectivite
                          where id = can_read_acces_restreint.collectivite_id
                          limit 1)
                        then have_lecture_acces(can_read_acces_restreint.collectivite_id)
                    else is_authenticated() end
    );

end;
$$language plpgsql security definer;
comment on function can_read_acces_restreint
    is 'Vrai si l''utilisateur a accès en lecture à la collectivité en prenant en compte la restriction access_restreint';

COMMIT;

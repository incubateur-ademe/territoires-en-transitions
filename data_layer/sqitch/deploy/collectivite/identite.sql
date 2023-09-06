-- Deploy tet:collectivite/identite to pg
-- requires: collectivite/collectivite
-- requires: collectivite/type

BEGIN;

create or replace function
    private.collectivite_type(collectivite_id integer)
    returns type_collectivite[]
    language sql
begin
    atomic
    select case
               when t is not null then '{"EPCI"}'
               when e is null then '{"commune"}'
               when e.nature = 'SMF' or e.nature = 'SIVOM' or e.nature = 'SMO' or
                    e.nature = 'SIVU' then
                   '{"EPCI", "syndicat"}'
               else '{"EPCI"}'
               end::type_collectivite[]
    from collectivite c
             left join epci e on c.id = e.collectivite_id
             left join collectivite_test t on c.id = t.collectivite_id
    where c.id = collectivite_type.collectivite_id;
end;

COMMIT;

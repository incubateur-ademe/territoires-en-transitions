-- Deploy tet:collectivite/identite to pg
-- requires: collectivite/collectivite
-- requires: collectivite/type

BEGIN;

-- Répare la fonction précédente.
create or replace function
    private.collectivite_type(collectivite_id integer)
    returns type_collectivite[]
as
$$
select case
           when c.id in (select commune.collectivite_id from commune) then '{"commune"}'
           when e.nature = 'SMF' or e.nature = 'SIVOM' or e.nature = 'SMO' or
                e.nature = 'SIVU' then
                   '{"EPCI", "syndicat"}'
           else '{"EPCI"}'
           end::type_collectivite[]
from collectivite c
         left join epci e on c.id = e.collectivite_id
where c.id = collectivite_type.collectivite_id;
$$ language sql stable;

COMMIT;

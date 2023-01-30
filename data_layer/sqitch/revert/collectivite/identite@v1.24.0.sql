-- Deploy tet:collectivite/identite to pg
-- requires: collectivite/collectivite
-- requires: collectivite/type

BEGIN;

-- restore previous version.
create or replace function
    private.collectivite_type(collectivite_id integer)
    returns type_collectivite[]
as
$$
select case
           when collectivite_type.collectivite_id in (select collectivite_id from commune) then '{"commune"}'
           when e.nature = 'SMF' or e.nature = 'SIVOM' or e.nature = 'SMO' or
                e.nature = 'SIVU' then
               '{"EPCI", "syndicat"}'
           else '{"EPCI"}'
           end::type_collectivite[]
from collectivite c
         left join epci e on c.id = e.collectivite_id
$$ language sql stable;
comment on function private.collectivite_type is
    'Renvoie la liste des `type_collectivite` correspondant à la collectivité';

COMMIT;

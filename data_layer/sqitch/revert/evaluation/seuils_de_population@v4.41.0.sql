-- Deploy tet:evaluation/seuils_de_population to pg

BEGIN;

create or replace function private.population_buckets(population integer)
    returns text[]
as
$$
with bornes as (select unnest(array [10000, 20000, 50000, 100000] :: int[]) as pop),
     plafonds as (select pop from bornes where bornes.pop > population)
select case
           when population > 100000 then '{"plus_de_100000"}'
           else array_agg('moins_de_' || plafonds.pop)
           end::text[]
from plafonds;
$$ language sql stable;
comment on function private.population_buckets is
    'Renvoie un tableau de valeurs représentant les seuils de population '
        'utilisés par le business pour la personnalisation des référentiels.';

COMMIT;

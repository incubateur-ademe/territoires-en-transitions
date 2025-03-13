-- Deploy tet:evaluation/seuils_de_population to pg

BEGIN;

create or replace function private.population_buckets(population integer)
    returns text[]
as
$$
select array_agg(population.tranche)::text[]
from
    (
        (
            with bornes_sup as (select unnest(array [10000, 20000, 50000, 100000] :: int[]) as pop),
                 plafonds as (select pop from bornes_sup where bornes_sup.pop > population)
            select 'moins_de_' || plafonds.pop as tranche
            from plafonds
        )
        union
        (
            with bornes_inf as (select unnest(array [20000, 100000] :: int[]) as pop),
                 planchers as (select pop from bornes_inf where bornes_inf.pop < population)
            select 'plus_de_' || planchers.pop as tranche
            from planchers
        )
    ) population
    ;
$$ language sql stable;
comment on function private.population_buckets is
    'Renvoie un tableau de valeurs représentant les seuils de population '
        'utilisés par le business pour la personnalisation des référentiels.';

COMMIT;

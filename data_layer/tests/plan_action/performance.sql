begin;

select plan(1);

-- La table pour stocker les mesures
create temporary table timing
(
    name  text primary key,
    start timestamptz,
    stop  timestamptz,
    delta interval generated always as ( stop - start ) stored
);


-- On chronomètre la vue.
insert into timing (name, start)
values ('fiches_action', clock_timestamp());

select *
from fiches_action
         join generate_series(1, 10) i on true
where collectivite_id = i;

update timing t
set stop = clock_timestamp()
where name = 'fiches_action';


-- Puis la table
insert into timing (name, start)
values ('fiche_action', clock_timestamp());

select *
from fiche_action
         join generate_series(1, 10) i on true
where collectivite_id = i;

update timing t
set stop = clock_timestamp()
where name = 'fiche_action';

do
$$
    begin
        -- On print dans les résultats de test.
        raise notice 'vue, table: %', (select array_agg(extract(seconds from delta)) from timing t);
    end
$$;

select case
           when true
               then
               skip('la performance de fiches_action n''est pas possible en CI.', 1)
           else
               ok((select (select extract(seconds from delta) from timing where name = 'fiches_action') <
                          (select extract(seconds from delta) from timing where name = 'fiche_action') * 10),
                  'La vue ne devrait pas être plus de dix fois plus lente que la table.')
           end;

rollback;

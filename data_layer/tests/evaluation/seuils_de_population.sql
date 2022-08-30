begin;
select plan(3);

select results_eq(
               'select * from private.population_buckets(15000);',
               'select ''{moins_de_20000,moins_de_100000}'' :: text[];',
               'Les buckets pour une population de 15000 devraient être : moins_de_20000 et moins_de_100000'
           );

select results_eq(
               'select * from private.population_buckets(1500);',
               'select ''{moins_de_5000,moins_de_10000,moins_de_20000,moins_de_100000}'' :: text[];',
               'Les buckets pour une population de 1500 devraient être : moins_de_5000, moins_de_10000, moins_de_20000 et moins_de_100000.'
           );

select results_eq(
               'select * from private.population_buckets(5000000);',
               'select ''{plus_de_100000}'' :: text[];',
               'Le bucket pour une population de 5000000 devrait être plus_de_100000.'
           );

rollback;

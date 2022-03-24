create or replace view collectivite_identite as
with population_commune as (
    select com.collectivite_id,
           case
               when ptot < 5000 then '{"moins_de_5000", "moins_de_10000", "moins_de_100000"}'
               when ptot < 10000 then '{"moins_de_10000", "moins_de_100000"}'
               when ptot < 100000 then '{"moins_de_100000"}'
               else '{}'
               end as population
    from commune com
             left join raw.population2019 pop on pop.com = com.code
),
     type_collectivite as (
         select c.id    as collectivite_id,
                case
                    when c.id in (select collectivite_id from commune) then '{"commune"}'
                    else '{"EPCI"}'
                    end as type
         from collectivite c
     )
select c.id,
       coalesce(pc.population, '{}') as population,
       coalesce(tc.type, '{}')       as type,        -- todo incomplete
       '{}'                          as localisation -- todo incomplete
from collectivite c
         left join population_commune pc on pc.collectivite_id = c.id
         left join type_collectivite tc on tc.collectivite_id = c.id
;


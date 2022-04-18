create schema if not exists private;

create or replace function private.population_buckets(population integer)
    returns text[]
as
$$
select case
           when population < 5000
               then '{"moins_de_5000", "moins_de_10000", "moins_de_100000"}'
           when population < 10000 then '{"moins_de_10000", "moins_de_100000"}'
           when population < 100000 then '{"moins_de_100000"}'
           else '{}'
           end::text[]
$$ language sql stable;
comment on function private.population_buckets is
    'Renvoie un tableau de valeurs représentant les seuils de population '
        'utilisés par le business pour la personnalisation des référentiels.';

create or replace view collectivite_identite as
with
    -- get population and drom from insee.
    meta_commune as (select com.collectivite_id,
                            private.population_buckets(ic.population) as   population,
                            case when ir.drom then '{"DOM"}' else '{}' end localisation
                     from commune com
                              left join imports.commune ic on ic.code = com.code
                              left join imports.region ir on ic.region_code = ir.code),
    -- get population from banatic and drom from insee.
    meta_epci as (select epci.collectivite_id,
                         private.population_buckets(ib.population) as   population,
                         case when ir.drom then '{"DOM"}' else '{}' end localisation
                  from epci
                           left join imports.banatic ib on ib.siren = epci.siren
                           left join imports.region ir on ib.region_code = ir.code),

    -- compute type from table and epci nature
    type_collectivite as (select c.id            as collectivite_id,
                                 case
                                     when c.id in (select collectivite_id from commune) then '{"commune"}'
                                     when e.nature = 'SMF' or e.nature = 'SIVOM' or e.nature = 'SMO' or
                                          e.nature = 'SIVU' then
                                         '{"EPCI", "syndicat"}'
                                     else '{"EPCI"}'
                                     end::text[] as type
                          from collectivite c
                                   left join epci e on c.id = e.collectivite_id)
-- coalesce null values from epci or collectivite data.
select c.id,
       coalesce(mc.population, me.population, '{}')::text[]     as population,
       coalesce(tc.type, '{}')::type_collectivite[]             as type,
       coalesce(mc.localisation, me.localisation, '{}')::text[] as localisation
from collectivite c
         left join meta_commune mc on mc.collectivite_id = c.id
         left join meta_epci me on me.collectivite_id = c.id
         left join type_collectivite tc on tc.collectivite_id = c.id;
comment on view collectivite_identite is
    'L''identité d''une collectivité pour la personnalisation des référentiels, utilisée par le business.';


create or replace view question_display as
with actions as (select question_id, array_agg(action_id) action_ids
                 from question_action
                 group by question_id),
     q as (select q.id    as id,
                  a.action_ids,
                  thematique_id,
                  type,
                  t.nom   as thematique_nom,
                  description,
                  types_collectivites_concernees,
                  formulation,
                  ordonnancement,
                  cx.json as choix
           from question q
                    join question_thematique t on t.id = q.thematique_id
                    join actions a on q.id = a.question_id
                    left join lateral (select array_agg(
                                                      json_build_object(
                                                              'id', c.id,
                                                              'label', c.formulation,
                                                              'ordonnancement', c.ordonnancement
                                                          )) as json
                                       from question_choix c
                                       where c.question_id = q.id) cx on true)
select q.id,
       action_ids,
       i.id as collectivite_id,
       thematique_id,
       q.type,
       thematique_nom,
       description,
       types_collectivites_concernees,
       formulation,
       ordonnancement,
       choix,
       population,
       localisation
from q
         join collectivite_identite i
              on q.types_collectivites_concernees && i.type
                  or q.types_collectivites_concernees is null
;
comment on view question_display is
    'Questions avec leurs choix par collectivité pour l''affichage dans le client';


create or replace view collectivite_carte_identite as
with
    -- get population and drom from insee.
    meta_commune as (select com.collectivite_id,
                            ic.population,
                            'Insee 12/01/2022' as population_source,
                            ic.code            as insee,
                            ir.libelle         as region_name,
                            id.libelle         as departement_name
                     from commune com
                              left join imports.commune ic on ic.code = com.code
                              left join imports.region ir on ic.region_code = ir.code
                              left join imports.departement id on ic.departement_code = id.code),
    -- get population from banatic and drom from insee.
    meta_epci as (select epci.collectivite_id,
                         ib.population,
                         'BANATIC 01/04/2022' as population_source,
                         ib.siren,
                         ir.libelle           as region_name,
                         id.libelle           as departement_name
                  from epci
                           left join imports.banatic ib on ib.siren = epci.siren
                           left join imports.region ir on ib.region_code = ir.code
                           left join imports.departement id on ib.departement_code = id.code),

    -- compute type from table and epci nature
    type_collectivite as (select c.id                       as collectivite_id,
                                 case
                                     when c.id in (select collectivite_id from commune) then 'commune'
                                     when e.nature = 'SMF' or e.nature = 'SIVOM' or e.nature = 'SMO' or
                                          e.nature = 'SIVU' then
                                         'syndicat'
                                     else 'EPCI'
                                     end::type_collectivite as type
                          from collectivite c
                                   left join epci e on c.id = e.collectivite_id)
-- coalesce null values from epci or collectivite data.
select c.collectivite_id,
       c.nom,
       tc.type                                                as type_collectivite,
       coalesce(mc.insee, me.siren, '')                       as code_siren_insee,
       coalesce(mc.region_name, me.region_name, '')           as region_name,
       coalesce(mc.departement_name, me.departement_name, '') as departement_name,
       coalesce(mc.population_source, me.population_source)   as population_source,
       coalesce(mc.population, me.population, 0)::int4        as population_totale

from named_collectivite c
         left join meta_commune mc on mc.collectivite_id = c.collectivite_id
         left join meta_epci me on me.collectivite_id = c.collectivite_id
         left join type_collectivite tc on tc.collectivite_id = c.collectivite_id;
comment on view collectivite_carte_identite is
    'Le contenu de la carte d''identité de la collectivité telle qu''affichée dans le client.';

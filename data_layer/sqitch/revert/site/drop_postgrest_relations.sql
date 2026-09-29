-- Revert tet:site/drop_postgrest_relations from pg

BEGIN;

-- Définitions reprises de la base avant suppression.

create function geojson(site_labellisation site_labellisation)
    returns setof jsonb
    language sql
    security definer
    rows 1
begin
    atomic
    select coalesce(cg.geojson, eg.geojson)
    from collectivite c
             left join stats.epci_geojson eg on c.siren::text = eg.siren
             left join stats.commune_geojson cg on c.commune_code::text = cg.insee
    where c.id = (geojson.site_labellisation).collectivite_id;
end;
comment on function geojson(site_labellisation) is
    'Le contour geojson de la collectivité.';

create function labellisations(site_labellisation)
    returns setof labellisation[]
    language sql
    security definer
    rows 1
begin
    atomic
    select coalesce(
                   (select array_agg(l)
                    from labellisation l
                    where l.collectivite_id = ($1).collectivite_id),
                   '{}'::labellisation[]
           );
end;
comment on function labellisations(site_labellisation) is
    'Données de labellisation historique.';

create function indicateur_artificialisation(site_labellisation)
    returns setof indicateur_artificialisation
    language sql
    security definer
    rows 1
begin
    atomic
    select ia
    from indicateur_artificialisation ia
    where ia.collectivite_id = ($1).collectivite_id;
end;
comment on function indicateur_artificialisation(site_labellisation) is
    'Flux de consommation d’espaces, par destination entre 2009 et 2022';

create function indicateurs_gaz_effet_serre(site_labellisation)
    returns jsonb
    language sql
    security definer
begin
    atomic
    select to_jsonb(array_agg(d))
    from (select iri.date_valeur,
                 iri.resultat,
                 id.identifiant_referentiel as identifiant,
                 src.libelle                as source
          from indicateur_valeur iri
                   join indicateur_definition id on iri.indicateur_id = id.id
                   join indicateur_source_metadonnee ism on ism.id = iri.metadonnee_id
                   join indicateur_source src on src.id = ism.source_id
          where iri.collectivite_id = ($1).collectivite_id
            and iri.metadonnee_id is not null
            and iri.resultat is not null
            and src.id = 'citepa'
            and id.identifiant_referentiel::text = any (array [
              'cae_1.g', 'cae_1.f', 'cae_1.h', 'cae_1.j', 'cae_1.i',
              'cae_1.c', 'cae_1.e', 'cae_1.d', 'cae_1.a'
              ]::text[])) d;
end;
comment on function indicateurs_gaz_effet_serre(site_labellisation) is
    'Indicateurs gaz à effet de serre.';

create view site_region
as
select insee, libelle
from stats.region_geojson;
revoke insert, update, delete on site_region from anon, authenticated, service_role;

create function geojson(site_region site_region)
    returns setof jsonb
    language sql
    security definer
    rows 1
begin
    atomic
    select rg.geojson
    from stats.region_geojson rg
    where rg.insee = (geojson.site_region).insee;
end;
comment on function geojson(site_region) is
    'Le contour geojson de la region.';

COMMIT;

-- Deploy tet:site/carto to pg

BEGIN;

create function
    geojson(site_labellisation site_labellisation)
    returns setof jsonb
    rows 1
    security definer
begin
    atomic
    select coalesce(eg.geojson, cg.geojson)
    from named_collectivite n
             left join epci e using (collectivite_id)
             left join stats.epci_geojson eg on e.siren = eg.siren
             left join commune c using (collectivite_id)
             left join stats.commune_geojson cg on c.code = cg.insee
    where n.collectivite_id = $1.collectivite_id;
end;
comment on function geojson(site_labellisation) is
    'Le contour geojson de la collectivité.';

create view site_region
as
select insee, libelle
from stats.region_geojson;

create function
    geojson(site_region site_region)
    returns setof jsonb
    rows 1
    security definer
begin
    atomic
    select geojson
    from stats.region_geojson rg
    where rg.insee = $1.insee;
end;
comment on function geojson(site_region) is
    'Le contour geojson de la region.';

COMMIT;

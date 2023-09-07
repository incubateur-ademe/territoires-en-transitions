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
comment on function geojson is
    'Le contour geojson de la collectivité.';

COMMIT;

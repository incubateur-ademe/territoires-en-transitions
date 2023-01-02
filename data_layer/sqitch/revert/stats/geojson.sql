-- Revert tet:stats/geojson from pg

BEGIN;

drop view stats.collectivite_geojson;
drop table stats.epci_geojson;
drop table stats.commune_geojson;
drop table stats.departement_geojson;
drop table stats.region_geojson;

COMMIT;

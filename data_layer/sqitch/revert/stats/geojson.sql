-- Revert tet:stats/geojson from pg

BEGIN;

drop table stats.epci_geojson;
drop table stats.commune_geojson;
drop table stats.departement_geojson;
drop table stats.region_geojson;
drop view stats.collectivite_geojson;

COMMIT;

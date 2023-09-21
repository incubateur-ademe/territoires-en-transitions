-- Revert tet:site/carto from pg

BEGIN;

drop function geojson(site_labellisation);
drop function geojson(site_region);
drop view site_region;

COMMIT;

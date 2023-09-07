-- Revert tet:site/carto from pg

BEGIN;

drop function geojson(site_labellisation);

COMMIT;

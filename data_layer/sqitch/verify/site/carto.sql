-- Verify tet:site/carto on pg

BEGIN;

select has_function_privilege('geojson(site_labellisation)', 'execute');

ROLLBACK;

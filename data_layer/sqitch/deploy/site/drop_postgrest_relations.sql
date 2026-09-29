-- Deploy tet:site/drop_postgrest_relations to pg
-- requires: site/carto
-- requires: site/labellisation
-- requires: indicateur/indicateurs_gaz_effet_serre
-- requires: collectivite/fusion

BEGIN;

-- Le site public lit désormais ses données via le backend
-- (tRPC collectivites.site.*). Ces « colonnes calculées » PostgREST et la vue
-- site_region n'ont plus d'appelant. La vue matérialisée site_labellisation
-- reste : le backend la lit.
drop function geojson(site_labellisation);
drop function labellisations(site_labellisation);
drop function indicateur_artificialisation(site_labellisation);
drop function indicateurs_gaz_effet_serre(site_labellisation);

drop function geojson(site_region);
drop view site_region;

COMMIT;

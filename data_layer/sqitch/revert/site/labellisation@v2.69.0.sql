-- Deploy tet:site/labellisation to pg

BEGIN;

drop function labellisations(site_labellisation);
drop function indicateurs_gaz_effet_serre(site_labellisation);

COMMIT;

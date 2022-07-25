-- Deploy tet:labellisation/labellisation_unique_constraint to pg

BEGIN;

alter table labellisation drop constraint labellisation_collectivite_id_annee_key;
alter table labellisation add unique (collectivite_id, annee, referentiel); 

COMMIT;

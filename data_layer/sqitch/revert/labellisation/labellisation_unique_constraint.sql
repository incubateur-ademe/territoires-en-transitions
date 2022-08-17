-- Revert tet:labellisation/labellisation_unique_constraint from pg

BEGIN;

alter table labellisation drop constraint labellisation_collectivite_id_annee_referentiel_key;
alter table labellisation add unique (collectivite_id, annee); 

COMMIT;

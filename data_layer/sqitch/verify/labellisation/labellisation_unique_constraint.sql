-- Verify tet:labellisation/labellisation_unique_constraint on pg

BEGIN;

comment on constraint labellisation_collectivite_id_annee_referentiel_key on labellisation is null; 

ROLLBACK;

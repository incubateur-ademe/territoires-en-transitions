-- Revert tet:referentiel/add_demande_associated_collectivite_id from pg

BEGIN;

ALTER TABLE labellisation.demande
  DROP COLUMN IF EXISTS associated_collectivite_id;

ALTER TABLE public.labellisation
  DROP COLUMN IF EXISTS audit_id;

COMMIT;

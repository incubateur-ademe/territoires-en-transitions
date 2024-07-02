-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- Enlève la valeur par défaut du champ 'statut' de la table 'fiche_action'

ALTER TABLE public.fiche_action
  ALTER COLUMN statut DROP DEFAULT;

COMMIT;

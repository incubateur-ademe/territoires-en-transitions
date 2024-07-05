-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- Modifie la valeur par défaut du champ 'statut' de la table 'fiche_action'

ALTER TABLE public.fiche_action
  ALTER COLUMN statut SET DEFAULT 'À venir'::public.fiche_action_statuts;


COMMIT;

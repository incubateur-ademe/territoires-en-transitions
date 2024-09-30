-- Deploy tet:plan_action to pg

BEGIN;

ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'Bloqué';
ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'En retard';
ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'A discuter';

CREATE OR REPLACE FUNCTION axe_enfant(axe)
  RETURNS SETOF axe
  LANGUAGE sql
  STABLE SECURITY INVOKER
AS $$
  SELECT * FROM axe WHERE plan = $1.id
$$;

COMMIT;

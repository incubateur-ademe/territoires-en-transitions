-- Deploy tet:plan_action to pg

BEGIN;

-- Ajoute des valeurs d'enum
ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'Bloqué';
ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'En retard';
ALTER TYPE fiche_action_statuts ADD VALUE IF NOT EXISTS 'A discuter';

-- Ajoute une relation calculée pour récupérer les axes enfants d'un plan
CREATE OR REPLACE FUNCTION axe_enfant(axe)
  RETURNS SETOF axe
  LANGUAGE sql
  STABLE SECURITY INVOKER
AS $$
  SELECT * FROM axe WHERE plan = $1.id
$$;

-- Ajoute une FK à partenaire_tag pour pouvoir faire fonctionner la ressource embedding avec PostgREST
ALTER TABLE partenaire_tag
ADD CONSTRAINT partenaire_tag_collectivite_id_fkey
FOREIGN KEY (collectivite_id)
REFERENCES collectivite(id);

COMMIT;

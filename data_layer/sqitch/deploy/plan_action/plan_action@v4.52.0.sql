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

-- Ajoute des FK pour pouvoir faire fonctionner les ressources embedding avec PostgREST
ALTER TABLE partenaire_tag
ADD CONSTRAINT partenaire_tag_collectivite_id_fkey
FOREIGN KEY (collectivite_id)
REFERENCES collectivite(id);

ALTER TABLE fiche_action_thematique
ADD CONSTRAINT fiche_action_thematique_thematique_id_fkey
FOREIGN KEY (thematique_id)
REFERENCES thematique(id);


-- Change primary key of `fiche_action_financeur_tag` to a composite key to allow resource embedding
-- Step 1: Remove the existing primary key constraint
ALTER TABLE fiche_action_financeur_tag DROP CONSTRAINT fiche_action_financeur_tag_pkey;

-- Step 2: Add the new composite primary key
ALTER TABLE fiche_action_financeur_tag ADD PRIMARY KEY (fiche_id, financeur_tag_id);


-- Change la foreign key de `fiche_action_referent` pour pointer sur `public.dcp` au lieu de `auth.users`.
-- Cela permet à PostgREST de requêter la ressource `dcp` liée.

ALTER TABLE fiche_action_referent
DROP CONSTRAINT IF EXISTS fiche_action_referent_user_id_fkey;

ALTER TABLE fiche_action_referent
ADD CONSTRAINT fiche_action_referent_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES dcp(user_id);



COMMIT;

-- Deploy tet:plan_action to pg

BEGIN;

-- Revert foreign key of `fiche_action_referent`

ALTER TABLE fiche_action_referent
DROP CONSTRAINT IF EXISTS fiche_action_referent_user_id_fkey;

ALTER TABLE fiche_action_referent
ADD CONSTRAINT fiche_action_referent_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id);



-- Revert primary key of `fiche_action_financeur_tag`
-- Step 1: Remove the composite primary key
ALTER TABLE fiche_action_financeur_tag DROP CONSTRAINT fiche_action_financeur_tag_pkey;

-- Step 2: Recreate the primary key on the id column
ALTER TABLE fiche_action_financeur_tag ADD CONSTRAINT fiche_action_financeur_tag_pkey PRIMARY KEY (id);



-- ENUM fiche_action_statuts
-- Unfortunately not possible to remove an enum value in postgres for now
--

ALTER TABLE fiche_action_thematique
DROP CONSTRAINT IF EXISTS fiche_action_thematique_thematique_id_fkey;

ALTER TABLE partenaire_tag
DROP CONSTRAINT IF EXISTS partenaire_tag_collectivite_id_fkey;

DROP FUNCTION axe_enfant(axe);

COMMIT;

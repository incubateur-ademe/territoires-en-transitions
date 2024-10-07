-- Deploy tet:plan_action to pg

BEGIN;

-- Revert primary key of `fiche_action_financeur_tag`
-- Step 1: Remove the composite primary key
ALTER TABLE fiche_action_financeur_tag DROP CONSTRAINT fiche_action_financeur_tag_pkey;

-- Step 2: Recreate the sequence for the id column
-- (Skip this step if you didn't drop the sequence earlier)
CREATE SEQUENCE fiche_action_financeur_tag_id_seq OWNED BY fiche_action_financeur_tag.id;

-- Step 3: Set the default value for the id column
ALTER TABLE fiche_action_financeur_tag ALTER COLUMN id SET DEFAULT nextval('fiche_action_financeur_tag_id_seq');
ALTER TABLE fiche_action_financeur_tag ALTER COLUMN id SET NOT NULL;

-- Step 4: Recreate the primary key on the id column
ALTER TABLE fiche_action_financeur_tag ADD CONSTRAINT fiche_action_financeur_tag_pkey PRIMARY KEY (id);

-- Step 5: If you dropped the id column (which was optional in the original script),
-- you'd need to recreate it. However, this would require more complex handling to
-- regenerate the ids, which is not included here.



-- ENUM fiche_action_statuts
-- Unfortunately not possible to remove an enum value in postgres for now
--

ALTER TABLE fiche_action_thematique
DROP CONSTRAINT IF EXISTS fiche_action_thematique_thematique_id_fkey;

ALTER TABLE partenaire_tag
DROP CONSTRAINT IF EXISTS partenaire_tag_collectivite_id_fkey;

DROP FUNCTION axe_enfant(axe);

COMMIT;

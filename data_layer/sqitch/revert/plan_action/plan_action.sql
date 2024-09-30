-- Deploy tet:plan_action to pg

BEGIN;

-- ENUM fiche_action_statuts
-- Unfortunately not possible to remove an enum value in postgres for now
--

ALTER TABLE partenaire_tag
DROP CONSTRAINT IF EXISTS partenaire_tag_collectivite_id_fkey;

DROP FUNCTION axe_enfant(axe);

COMMIT;

-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- Ajoute des index sur `fiche_action` et autres tables liées
-- pour améliorer les performances des requêtes de jointure et de filtre

CREATE INDEX IF NOT EXISTS fiche_action_collectivite_id_idx
  ON fiche_action (collectivite_id);

CREATE INDEX IF NOT EXISTS fiche_action_collectivite_id_modified_at_idx
  ON fiche_action (collectivite_id, modified_at);

CREATE INDEX IF NOT EXISTS fiche_action_lien_fiche_une_idx
  ON fiche_action_lien (fiche_une);

CREATE INDEX IF NOT EXISTS fiche_action_lien_fiche_deux_idx
  ON fiche_action_lien (fiche_deux);

CREATE INDEX IF NOT EXISTS fiche_action_service_tag_service_tag_id_idx
  ON fiche_action_service_tag (service_tag_id);

CREATE INDEX IF NOT EXISTS fiche_action_structure_tag_structure_tag_id_idx
  ON fiche_action_structure_tag (structure_tag_id);

CREATE INDEX IF NOT EXISTS fiche_action_partenaire_tag_partenaire_tag_id_idx
  ON fiche_action_partenaire_tag (partenaire_tag_id);


-- Supprime les computed field associés à la vue `fiche_actions`
-- qui étaient utilisés pour les filtres du tableau de bord.
-- (à la place on filtre désormais directement sur la table `fiche_action`)

DROP FUNCTION IF EXISTS public.fiche_action_service_tag(public.fiches_action);

DROP FUNCTION IF EXISTS public.fiche_action_structure_tag(public.fiches_action);

DROP FUNCTION IF EXISTS public.fiche_action_personne_tag(public.fiches_action);

DROP FUNCTION IF EXISTS public.fiche_action_axe(public.fiches_action);

DROP FUNCTION IF EXISTS public.fiche_action_pilote(public.fiches_action);


-- Change la foreign key de `fiche_action_pilote` pour pointer sur `public.dcp` 
-- au lieu de `auth.users`. Cela permet à PostgREST de requêter la ressource `dcp` liée.

ALTER TABLE fiche_action_pilote 
DROP CONSTRAINT IF EXISTS fiche_action_pilote_user_id_fkey;

ALTER TABLE fiche_action_pilote
ADD CONSTRAINT fiche_action_pilote_user_id_fkey 
FOREIGN KEY (user_id)
REFERENCES dcp(user_id);


COMMIT;

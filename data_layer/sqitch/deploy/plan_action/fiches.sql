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
-- 👇

DROP FUNCTION IF EXISTS public.fiche_action_service_tag(public.fiches_action);

DROP FUNCTION IF EXISTS public.fiche_action_structure_tag(public.fiches_action);

DROP FUNCTION IF EXISTS public.fiche_action_personne_tag(public.fiches_action);

DROP FUNCTION IF EXISTS public.fiche_action_axe(public.fiches_action);

DROP FUNCTION IF EXISTS public.fiche_action_pilote(public.fiches_action);


-- On garde ce computed field pour les DCP associés à fiche_action_pilote
-- dont la foreign key pointe sur auth.users au lieu de public.dcp
CREATE OR REPLACE FUNCTION public.fiche_action_pilote_dcp(public.fiche_action_pilote)
    RETURNS SETOF public.dcp ROWS 1
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC

    SELECT dcp.*
    FROM dcp
    WHERE dcp.user_id = $1.user_id
    ;
END;


COMMIT;

-- Deploy tet:demarche/pcaet_vulnerabilite_sous_thematiques to pg
-- requires: demarche/pcaet_vulnerabilite_thematique_socle_recadre

BEGIN;

-- ===========================================================================
-- 1. Une thématique se décline en sous-thématiques, sur un seul niveau.
--    L'auto-référence suffit : une table séparée ferait deux chemins de
--    lecture là où le tableau n'en rend qu'un.
-- ===========================================================================
ALTER TABLE public.demarche_pcaet_vulnerabilite_thematique
    ADD COLUMN parent_id integer NULL
        REFERENCES public.demarche_pcaet_vulnerabilite_thematique(id)
        ON DELETE CASCADE;

COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_thematique.parent_id IS
    'Thématique parente, NULL pour une racine. La hiérarchie tient sur un seul niveau : une sous-thématique n''en porte jamais à son tour. La suppression de la parente emporte ses sous-thématiques.';

CREATE INDEX demarche_pcaet_vulnerabilite_thematique_parent_id_idx
    ON public.demarche_pcaet_vulnerabilite_thematique (parent_id);

-- ===========================================================================
-- 2. Les deux invariants de la hiérarchie. Ils ne s'expriment pas en CHECK :
--    l'un comme l'autre regardent une autre ligne que celle écrite.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.demarche_pcaet_vulnerabilite_thematique_parent_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    parent record;
BEGIN
    IF new.parent_id IS NULL THEN
        RETURN new;
    END IF;

    IF new.parent_id = new.id THEN
        RAISE EXCEPTION
            'Une thématique de vulnérabilité ne peut être sa propre parente'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Le verrou de la parente sérialise les écritures concurrentes : sans lui,
    -- greffer un enfant sous A pendant qu'on rattache A sous B produit les
    -- deux sous-niveaux que ce trigger existe pour interdire, chaque
    -- transaction ayant lu un état sans conflit.
    SELECT parent_id, collectivite_id
      INTO parent
      FROM public.demarche_pcaet_vulnerabilite_thematique
     WHERE id = new.parent_id
       FOR UPDATE;

    -- Deux façons d'atteindre le second sous-niveau : se greffer sous un
    -- enfant, ou — à l'UPDATE seulement, un id fraîchement créé n'étant
    -- référencé par personne — devenir enfant en ayant déjà une descendance.
    IF parent.parent_id IS NOT NULL
       OR (tg_op = 'UPDATE' AND EXISTS (
            SELECT 1
              FROM public.demarche_pcaet_vulnerabilite_thematique enfant
             WHERE enfant.parent_id = new.id
          ))
    THEN
        RAISE EXCEPTION
            'Les sous-thématiques de vulnérabilité tiennent sur un seul niveau'
            USING ERRCODE = 'check_violation';
    END IF;

    IF parent.collectivite_id IS DISTINCT FROM new.collectivite_id THEN
        RAISE EXCEPTION
            'Une sous-thématique de vulnérabilité relève du même propriétaire que sa parente'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN new;
END;
$$;

COMMENT ON FUNCTION public.demarche_pcaet_vulnerabilite_thematique_parent_check() IS
    'Plafonne la hiérarchie des thématiques de vulnérabilité à un seul sous-niveau et interdit de greffer une sous-thématique sur une thématique d''un autre propriétaire — le socle, dont le collectivite_id est nul, n''en accueille donc aucune. Dernier rempart : le service applicatif refuse déjà ces cas avec un message adressé à l''utilisateur.';

CREATE TRIGGER demarche_pcaet_vulnerabilite_thematique_parent_check
    BEFORE INSERT OR UPDATE OF parent_id
    ON public.demarche_pcaet_vulnerabilite_thematique
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_vulnerabilite_thematique_parent_check();

-- ===========================================================================
-- 3. L'unicité du libellé se joue désormais dans la fratrie, pas dans toute la
--    collectivité : deux parentes peuvent chacune avoir leur « Sécheresse ».
--    `NULLS NOT DISTINCT` fait tenir la règle sur les racines aussi, dont le
--    parent_id est nul : par défaut Postgres tient deux NULL pour distincts et
--    laisserait passer deux racines homonymes. Même idiome que
--    demarche_pcaet_topic_row, la table jumelle du diagnostic.
-- ===========================================================================
DROP INDEX public.demarche_pcaet_vulnerabilite_thematique_collectivite_label_key;

CREATE UNIQUE INDEX demarche_pcaet_vulnerabilite_thematique_collectivite_label_key
    ON public.demarche_pcaet_vulnerabilite_thematique
       (collectivite_id, parent_id, lower(label)) NULLS NOT DISTINCT
    WHERE collectivite_id IS NOT NULL;

-- ===========================================================================
-- 4. Les risques naturels, arbitrés avec le bureau de l'adaptation au
--    changement climatique. La parente reste saisissable : elle porte le
--    niveau d'ensemble, ses sous-thématiques le détail, et rien ne contraint
--    l'un à s'accorder avec l'autre.
--    Rejouable comme les INSERT de socle qui précèdent.
-- ===========================================================================
INSERT INTO public.demarche_pcaet_vulnerabilite_thematique
    (code, label, collectivite_id, requis, display_order)
VALUES
    ('risques_naturels', 'Risques naturels', NULL, true, 10)
ON CONFLICT (code) WHERE collectivite_id IS NULL DO UPDATE
    SET label         = EXCLUDED.label,
        requis        = EXCLUDED.requis,
        display_order = EXCLUDED.display_order,
        modified_at   = now();

INSERT INTO public.demarche_pcaet_vulnerabilite_thematique
    (code, label, collectivite_id, requis, display_order, parent_id)
SELECT enfant.code,
       enfant.label,
       NULL,
       true,
       enfant.display_order,
       parent.id
  FROM (VALUES
        ('risque_secheresse',                 'Sécheresse',                          1),
        ('risque_inondation',                 'Inondation',                          2),
        ('risque_incendie_foret',             'Incendie de forêt et de végétation',  3),
        ('risque_submersion_marine',          'Submersion marine',                   4),
        ('risque_vagues_chaleur',             'Vagues de chaleur',                   5),
        ('risque_recul_trait_cote',           'Recul du trait de côte',              6),
        ('risque_retrait_gonflement_argiles', 'Retrait-gonflement des argiles',      7),
        ('risque_cyclones',                   'Cyclones',                            8)
       ) AS enfant(code, label, display_order)
  CROSS JOIN (
        SELECT id
          FROM public.demarche_pcaet_vulnerabilite_thematique
         WHERE collectivite_id IS NULL AND code = 'risques_naturels'
       ) AS parent
ON CONFLICT (code) WHERE collectivite_id IS NULL DO UPDATE
    SET label         = EXCLUDED.label,
        requis        = EXCLUDED.requis,
        display_order = EXCLUDED.display_order,
        parent_id     = EXCLUDED.parent_id,
        modified_at   = now();

-- Les dépôts en cours voient les thématiques du socle sans rattachement, mais
-- leur ligne de saisie est aussi ce qui les rattache : sans elle, la saisie
-- d'une sous-thématique n'aurait nulle part où atterrir.
INSERT INTO public.demarche_pcaet_vulnerabilite_valeur (demarche_id, thematique_id)
-- Les démarches sont dédoublonnées avant le croisement : l'inverse ferait
-- porter l'agrégat sur neuf fois plus de lignes, pour le même résultat.
SELECT d.demarche_id, t.id
  FROM (
        SELECT DISTINCT demarche_id
          FROM public.demarche_pcaet_vulnerabilite_valeur
       ) d
 CROSS JOIN public.demarche_pcaet_vulnerabilite_thematique t
 WHERE t.collectivite_id IS NULL
   AND t.code IN ('risques_naturels', 'risque_secheresse', 'risque_inondation',
                  'risque_incendie_foret', 'risque_submersion_marine',
                  'risque_vagues_chaleur', 'risque_recul_trait_cote',
                  'risque_retrait_gonflement_argiles', 'risque_cyclones')
ON CONFLICT (demarche_id, thematique_id) DO NOTHING;

COMMIT;

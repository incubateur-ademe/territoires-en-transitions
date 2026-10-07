-- Revert tet:demarche/pcaet_vulnerabilite_sous_thematiques from pg

BEGIN;

-- Les sous-thématiques partent avec leur parente (ON DELETE CASCADE), et leurs
-- lignes de saisie avec elles.
DELETE FROM public.demarche_pcaet_vulnerabilite_thematique
WHERE collectivite_id IS NULL
  AND code = 'risques_naturels';

DROP TRIGGER demarche_pcaet_vulnerabilite_thematique_parent_check
    ON public.demarche_pcaet_vulnerabilite_thematique;
DROP FUNCTION public.demarche_pcaet_vulnerabilite_thematique_parent_check();

-- Les index tombent avant la remontée à la racine : deux sœurs homonymes de
-- fratries différentes se heurteraient sinon sur l'unicité par fratrie, qui
-- n'a plus lieu d'être.
DROP INDEX public.demarche_pcaet_vulnerabilite_thematique_collectivite_label_key;
DROP INDEX public.demarche_pcaet_vulnerabilite_thematique_parent_id_idx;

-- Une sous-thématique ajoutée par une collectivité n'a plus de place dans le
-- modèle plat : elle remonte à la racine plutôt que d'être perdue.
UPDATE public.demarche_pcaet_vulnerabilite_thematique
   SET parent_id = NULL
 WHERE parent_id IS NOT NULL;

ALTER TABLE public.demarche_pcaet_vulnerabilite_thematique
    DROP COLUMN parent_id;

-- La remontée à la racine peut avoir créé des homonymes : le dernier arrivé
-- est renommé plutôt que de faire échouer le retour arrière.
UPDATE public.demarche_pcaet_vulnerabilite_thematique t
   SET label = t.label || ' (' || t.id || ')'
  FROM public.demarche_pcaet_vulnerabilite_thematique autre
 WHERE t.collectivite_id IS NOT NULL
   AND autre.collectivite_id = t.collectivite_id
   AND lower(autre.label) = lower(t.label)
   AND autre.id < t.id;

CREATE UNIQUE INDEX demarche_pcaet_vulnerabilite_thematique_collectivite_label_key
    ON public.demarche_pcaet_vulnerabilite_thematique (collectivite_id, lower(label))
    WHERE collectivite_id IS NOT NULL;

COMMIT;

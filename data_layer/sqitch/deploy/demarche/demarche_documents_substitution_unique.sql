-- Deploy tet:demarche/demarche_documents_substitution_unique to pg
-- requires: demarche/demarche_documents_inclusion_declaree

BEGIN;

-- ===========================================================================
-- 1. Une seule mécanique de couverture : la substitution entre pièces. Le
--    dispositif de suivi et d'évaluation se trouve dans le programme d'actions
--    — c'est une inclusion entre pièces du dossier, pas une prise en charge par
--    la plateforme. Déclarable, donc : la case ne s'offre que si le programme
--    d'actions est lui-même déposé.
-- ===========================================================================
INSERT INTO public.demarche_document_substitution (document_id, substitut_id, automatic)
VALUES ('pcaet_dispositif_suivi_evaluation', 'pcaet_plan_actions', false)
ON CONFLICT (document_id, substitut_id) DO UPDATE SET automatic = false;

-- ===========================================================================
-- 2. `couverture_plateforme` n'a plus d'usage : la couverture sans dépôt passe
--    toute par la substitution, automatique ou déclarée.
-- ===========================================================================
ALTER TABLE public.demarche_document_definition
    DROP COLUMN couverture_plateforme;

-- ===========================================================================
-- 3. `portee` distinguait le document global des sections du détail. La liste
--    est unique depuis que le global y a pris sa place, à son rang : la colonne
--    ne sert plus qu'à répéter ce que `requis` et `ordre` disent déjà.
-- ===========================================================================
ALTER TABLE public.demarche_document_definition
    DROP COLUMN portee;

COMMIT;

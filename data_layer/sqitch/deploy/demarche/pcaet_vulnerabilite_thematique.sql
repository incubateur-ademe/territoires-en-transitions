-- Deploy tet:demarche/pcaet_vulnerabilite_thematique to pg
-- requires: demarche/pcaet_vulnerabilite

BEGIN;

-- ===========================================================================
-- Le cadre de dépôt parle de thématiques de vulnérabilité, pas de domaines :
-- l'interface le disait déjà, le modèle suit pour que le même mot désigne la
-- même chose de la table au libellé. Renommage pur, aucune donnée ne bouge.
-- ===========================================================================
ALTER TABLE public.demarche_pcaet_vulnerabilite_domaine
    RENAME TO demarche_pcaet_vulnerabilite_thematique;

ALTER SEQUENCE public.demarche_pcaet_vulnerabilite_domaine_id_seq
    RENAME TO demarche_pcaet_vulnerabilite_thematique_id_seq;

ALTER TABLE public.demarche_pcaet_vulnerabilite_thematique
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_domaine_pkey
                   TO demarche_pcaet_vulnerabilite_thematique_pkey;
ALTER TABLE public.demarche_pcaet_vulnerabilite_thematique
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_domaine_code_socle_check
                   TO demarche_pcaet_vulnerabilite_thematique_code_socle_check;
ALTER TABLE public.demarche_pcaet_vulnerabilite_thematique
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_domaine_label_check
                   TO demarche_pcaet_vulnerabilite_thematique_label_check;
ALTER TABLE public.demarche_pcaet_vulnerabilite_thematique
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_domaine_collectivite_id_fkey
                   TO demarche_pcaet_vulnerabilite_thematique_collectivite_id_fkey;

ALTER INDEX public.demarche_pcaet_vulnerabilite_domaine_code_key
    RENAME TO demarche_pcaet_vulnerabilite_thematique_code_key;
ALTER INDEX public.demarche_pcaet_vulnerabilite_domaine_collectivite_label_key
    RENAME TO demarche_pcaet_vulnerabilite_thematique_collectivite_label_key;
ALTER INDEX public.demarche_pcaet_vulnerabilite_domaine_collectivite_id_idx
    RENAME TO demarche_pcaet_vulnerabilite_thematique_collectivite_id_idx;

ALTER TABLE public.demarche_pcaet_vulnerabilite_valeur
    RENAME COLUMN domaine_id TO thematique_id;

ALTER TABLE public.demarche_pcaet_vulnerabilite_valeur
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_valeur_domaine_id_fkey
                   TO demarche_pcaet_vulnerabilite_valeur_thematique_id_fkey;

ALTER INDEX public.demarche_pcaet_vulnerabilite_valeur_domaine_id_idx
    RENAME TO demarche_pcaet_vulnerabilite_valeur_thematique_id_idx;

-- Les commentaires portent le vocabulaire : ils sont réécrits ici plutôt que
-- dans la migration d'origine, qui est déjà déployée.
COMMENT ON TABLE public.demarche_pcaet_vulnerabilite_thematique IS
    'Thématiques et milieux de vulnérabilité du territoire. collectivite_id NULL = socle commun, ni renommable ni supprimable ; renseigné = thématique ajoutée par la collectivité, partagée par toutes ses démarches.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_thematique.code IS
    'Identifiant métier stable de la thématique du socle, sur lequel s''appuient les tests et les futures migrations. NULL pour une thématique ajoutée.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_thematique.collectivite_id IS
    'Collectivité propriétaire de la thématique ajoutée. NULL pour le socle.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_thematique.requis IS
    'Une thématique requise doit être renseignée pour que la vulnérabilité soit complète. Fixé par migration : l''échappatoire offerte à la collectivité est le niveau « non concerné », pas la dispense.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_thematique.display_order IS
    'Ordre d''affichage. Le socle occupe la plage basse, les ajouts se rangent au-delà de 1000.';

COMMENT ON TABLE public.demarche_pcaet_vulnerabilite_valeur IS
    'Diagnostic de vulnérabilité d''une démarche pour une thématique : les niveaux constatés et projetés, et les objectifs d''adaptation décrits. Une ligne absente vaut thématique non renseignée.';

COMMENT ON COLUMN public.demarche_pcaet_topic.kind IS
    'indicateurs = grille de saisie adossée au référentiel CAE ; vulnerabilite = table de niveaux par thématique.';

COMMIT;

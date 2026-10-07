-- Revert tet:demarche/pcaet_vulnerabilite_thematique from pg

BEGIN;

ALTER TABLE public.demarche_pcaet_vulnerabilite_thematique
    RENAME TO demarche_pcaet_vulnerabilite_domaine;

ALTER SEQUENCE public.demarche_pcaet_vulnerabilite_thematique_id_seq
    RENAME TO demarche_pcaet_vulnerabilite_domaine_id_seq;

ALTER TABLE public.demarche_pcaet_vulnerabilite_domaine
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_thematique_pkey
                   TO demarche_pcaet_vulnerabilite_domaine_pkey;
ALTER TABLE public.demarche_pcaet_vulnerabilite_domaine
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_thematique_code_socle_check
                   TO demarche_pcaet_vulnerabilite_domaine_code_socle_check;
ALTER TABLE public.demarche_pcaet_vulnerabilite_domaine
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_thematique_label_check
                   TO demarche_pcaet_vulnerabilite_domaine_label_check;
ALTER TABLE public.demarche_pcaet_vulnerabilite_domaine
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_thematique_collectivite_id_fkey
                   TO demarche_pcaet_vulnerabilite_domaine_collectivite_id_fkey;

ALTER INDEX public.demarche_pcaet_vulnerabilite_thematique_code_key
    RENAME TO demarche_pcaet_vulnerabilite_domaine_code_key;
ALTER INDEX public.demarche_pcaet_vulnerabilite_thematique_collectivite_label_key
    RENAME TO demarche_pcaet_vulnerabilite_domaine_collectivite_label_key;
ALTER INDEX public.demarche_pcaet_vulnerabilite_thematique_collectivite_id_idx
    RENAME TO demarche_pcaet_vulnerabilite_domaine_collectivite_id_idx;

ALTER TABLE public.demarche_pcaet_vulnerabilite_valeur
    RENAME COLUMN thematique_id TO domaine_id;

ALTER TABLE public.demarche_pcaet_vulnerabilite_valeur
    RENAME CONSTRAINT demarche_pcaet_vulnerabilite_valeur_thematique_id_fkey
                   TO demarche_pcaet_vulnerabilite_valeur_domaine_id_fkey;

ALTER INDEX public.demarche_pcaet_vulnerabilite_valeur_thematique_id_idx
    RENAME TO demarche_pcaet_vulnerabilite_valeur_domaine_id_idx;

COMMIT;

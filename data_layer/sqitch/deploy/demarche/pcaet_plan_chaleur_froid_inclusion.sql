-- Deploy tet:demarche/pcaet_plan_chaleur_froid_inclusion to pg
-- requires: demarche/pcaet_plan_chaleur_froid_commune_membre

BEGIN;

-- Le PLCF (diagnostic, objectifs, programme d'actions) se répartit en général
-- dans le diagnostic, la stratégie et le programme d'actions du PCAET : la
-- collectivité peut le déclarer compris dans l'un ou l'autre, pas seulement
-- dans le programme d'actions.
INSERT INTO public.demarche_document_substitution (document_id, substitut_id, automatic)
VALUES ('pcaet_plan_chaleur_froid', 'pcaet_diagnostic', false),
       ('pcaet_plan_chaleur_froid', 'pcaet_strategie_territoriale', false),
       ('pcaet_plan_chaleur_froid', 'pcaet_plan_actions', false)
ON CONFLICT (document_id, substitut_id) DO UPDATE SET automatic = false;

COMMIT;

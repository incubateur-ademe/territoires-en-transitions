-- Deploy tet:demarche/pcaet_plan_chaleur_froid_commune_membre to pg
-- requires: demarche/pcaet_scot_aec

BEGIN;

-- ===========================================================================
-- Le plan local de chaleur et de froid se lisait sur la population propre de
-- la collectivité. La loi (art. L229-26 du code de l'environnement) l'attend
-- « de la métropole de Lyon et des EPCI à fiscalité propre comprenant au moins
-- une commune de plus de 45 000 habitants » : c'est la plus peuplée des
-- communes membres qui compte, pas le groupement. Un EPCI de 60 000 habitants
-- fait de petites communes n'y est pas tenu ; un syndicat non plus, quelle que
-- soit sa taille.
-- ===========================================================================
UPDATE public.demarche_document_definition
SET expr_applicable = 'identite(soustype, epci_a_fiscalite_propre) et identite(commune_membre, plus_de_45000)',
    description     = 'Attendu des EPCI à fiscalité propre dont au moins une commune membre dépasse 45 000 habitants.',
    modified_at     = now()
WHERE id = 'pcaet_plan_chaleur_froid';

COMMIT;

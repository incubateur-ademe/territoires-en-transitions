-- Deploy tet:demarche/pcaet_date_adoption to pg
-- requires: demarche/statut_publication_fusionne

BEGIN;

-- Publier vaut adopter, mais la mise en ligne et l'adoption ne tombent pas le
-- même jour : la délibération d'adoption a une date propre, saisie par la
-- collectivité au moment de valider le dépôt final. C'est elle qui fait courir
-- les 6 ans de validité du PCAET, pas l'horodatage de la publication.
-- Type `date` et non `timestamptz` : une date de délibération est une date
-- civile, sans heure ni fuseau.
ALTER TABLE public.demarche ADD COLUMN adopted_at date NULL;

COMMENT ON COLUMN public.demarche.adopted_at IS
    'Date de la délibération d''adoption, saisie à la validation du dépôt final. Référence du suivi de validité (renouvellement tous les 6 ans). NULL tant que la démarche n''est pas publiée.';

-- Les dossiers déjà publiés n'ont que leur date de mise en ligne : à défaut de
-- mieux, elle tient lieu de date d'adoption.
UPDATE public.demarche
SET adopted_at = published_at::date
WHERE published_at IS NOT NULL;

COMMIT;

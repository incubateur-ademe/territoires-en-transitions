-- Verify tet:indicateur/correct-formule-cae-2-a on pg

BEGIN;
-- Refuse une vue filtrée par RLS ; ce réglage ne contourne pas les politiques.
SET LOCAL row_security = off;

DO $verify$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.indicateur_definition
        WHERE identifiant_referentiel = 'cae_2.a'
          AND collectivite_id IS NULL
          AND valeur_calcule ~
              '(?<![[:alnum:]_.-])cae_2[.]lpcaet(?![[:alnum:]_.-])'
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'La formule prédéfinie cae_2.a référence encore cae_2.lpcaet';
    END IF;
END;
$verify$;

ROLLBACK;

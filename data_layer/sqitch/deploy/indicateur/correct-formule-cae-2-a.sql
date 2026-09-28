-- Deploy tet:indicateur/correct-formule-cae-2-a to pg
-- requires: indicateur/fusion

BEGIN;

-- Corrige uniquement la référence erronée du catalogue. Les observations
-- enregistrées ne sont ni recalculées ni modifiées par cette réparation.
DO $repair$
DECLARE
    definition record;
    bad_token_pattern constant text :=
        '(?<![[:alnum:]_.-])cae_2[.]lpcaet(?![[:alnum:]_.-])';
    bad_token_count integer;
BEGIN
    SELECT id, valeur_calcule
    INTO definition
    FROM public.indicateur_definition
    WHERE identifiant_referentiel = 'cae_2.a'
      AND collectivite_id IS NULL
    FOR UPDATE;

    -- Le catalogue peut être absent avant le peuplement d'une base neuve.
    IF NOT FOUND OR NULLIF(btrim(definition.valeur_calcule), '') IS NULL THEN
        RETURN;
    END IF;

    SELECT count(*)
    INTO bad_token_count
    FROM regexp_matches(definition.valeur_calcule, bad_token_pattern, 'g');

    -- Une base dont le catalogue est déjà corrigé reste inchangée.
    IF bad_token_count = 0 THEN
        RETURN;
    END IF;

    IF bad_token_count <> 1 THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'La réparation de cae_2.a attend exactement une référence à cae_2.lpcaet';
    END IF;

    PERFORM 1
    FROM public.indicateur_definition
    WHERE identifiant_referentiel = 'cae_2.l_pcaet'
      AND collectivite_id IS NULL
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = 'La réparation de cae_2.a nécessite la définition prédéfinie cae_2.l_pcaet';
    END IF;

    UPDATE public.indicateur_definition
    SET valeur_calcule = regexp_replace(
        definition.valeur_calcule,
        bad_token_pattern,
        'cae_2.l_pcaet',
        'g'
    )
    WHERE id = definition.id
      AND identifiant_referentiel = 'cae_2.a'
      AND collectivite_id IS NULL
      AND valeur_calcule = definition.valeur_calcule;
END;
$repair$;

COMMIT;

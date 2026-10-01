-- Revert tet:indicateur/margny_indicateurs_mensuels from pg
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL TIME ZONE 'UTC';
SET LOCAL DateStyle = 'ISO, YMD';
SET LOCAL extra_float_digits = 3;
SET LOCAL row_security = off;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN ACCESS EXCLUSIVE MODE;
LOCK TABLE private.indicateur_valeur_date_repair IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE margny_monthly_values (
    valeur_id integer PRIMARY KEY, indicateur_id integer, mois integer
) ON COMMIT DROP;
INSERT INTO margny_monthly_values VALUES
    (11979621,31816,1), (11979622,31816,2), (11979623,31816,3),
    (11979624,31816,4), (12374016,32392,11), (12374017,32392,12);

DO $margny$
BEGIN
    IF NOT EXISTS (SELECT FROM private.indicateur_valeur_date_repair
                   WHERE valeur_id IN (SELECT valeur_id FROM margny_monthly_values))
       AND NOT EXISTS (SELECT FROM public.indicateur_definition
                       WHERE id IN (31816,32392) AND collectivite_id = 2181) THEN
        RETURN;
    END IF;

    IF (SELECT count(*) FROM private.indicateur_valeur_date_repair
        WHERE valeur_id IN (SELECT valeur_id FROM margny_monthly_values)) <> 6
       OR (SELECT count(*) FROM public.indicateur_definition
           WHERE id IN (31816,32392) AND collectivite_id = 2181
             AND periodicite = 'mensuelle' AND identifiant_referentiel IS NULL
             AND valeur_calcule IS NULL) <> 2
       OR EXISTS (SELECT FROM public.indicateur_groupe WHERE parent IN (31816,32392) OR enfant IN (31816,32392))
       OR EXISTS (SELECT FROM private.indicateur_definition_dependance_calcul WHERE indicateur_id IN (31816,32392))
       OR EXISTS (SELECT FROM public.action_score_indicateur_valeur WHERE indicateur_valeur_id IN (SELECT valeur_id FROM margny_monthly_values))
       OR EXISTS (SELECT FROM public.indicateur_valeur
                  WHERE indicateur_id IN (31816,32392)
                    AND id NOT IN (SELECT valeur_id FROM margny_monthly_values))
       OR EXISTS (
        SELECT FROM margny_monthly_values expected
        JOIN private.indicateur_valeur_date_repair archive ON archive.valeur_id = expected.valeur_id
        LEFT JOIN public.indicateur_valeur valeur ON valeur.id = expected.valeur_id
        WHERE to_jsonb(valeur) IS DISTINCT FROM (archive.avant || jsonb_build_object(
            'periodicite','mensuelle', 'date_valeur',make_date(2025,expected.mois,1)))
           OR (archive.avant->>'id')::integer IS DISTINCT FROM expected.valeur_id
           OR (archive.avant->>'indicateur_id')::integer IS DISTINCT FROM expected.indicateur_id
           OR (archive.avant->>'collectivite_id')::integer IS DISTINCT FROM 2181
           OR (archive.avant->>'date_valeur')::date IS DISTINCT FROM make_date(202500+expected.mois,1,1)
           OR CASE WHEN expected.valeur_id IN (11979624,12374017) THEN
                archive.apres IS NULL
                OR (archive.apres->>'date_valeur')::date IS DISTINCT FROM DATE '2025-01-01'
                OR (archive.apres - ARRAY['date_valeur','modified_at','modified_by'])
                    IS DISTINCT FROM (archive.avant - ARRAY['date_valeur','modified_at','modified_by'])
              ELSE archive.apres IS NOT NULL END
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Margny : retour arrière refusé après une modification ou avec une archive incomplète';
    END IF;

    ALTER TABLE public.indicateur_definition DISABLE TRIGGER empecher_changement_periodicite_indicateur;
    ALTER TABLE public.indicateur_definition DISABLE TRIGGER modified_at;
    ALTER TABLE public.indicateur_definition DISABLE TRIGGER modified_by;
    UPDATE public.indicateur_definition SET periodicite = 'annuelle'
    WHERE id IN (31816,32392) AND collectivite_id = 2181;
    ALTER TABLE public.indicateur_definition ENABLE TRIGGER modified_by;
    ALTER TABLE public.indicateur_definition ENABLE TRIGGER modified_at;
    ALTER TABLE public.indicateur_definition ENABLE TRIGGER empecher_changement_periodicite_indicateur;

    DELETE FROM public.indicateur_valeur WHERE id IN (11979621,11979622,11979623,12374016);
    ALTER TABLE public.indicateur_valeur DISABLE TRIGGER verifier_periodicite_valeur_indicateur;
    ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_at;
    ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_by;
    UPDATE public.indicateur_valeur valeur SET
        periodicite = 'annuelle', date_valeur = DATE '2025-01-01',
        modified_at = (archive.apres->>'modified_at')::timestamptz,
        modified_by = (archive.apres->>'modified_by')::uuid
    FROM private.indicateur_valeur_date_repair archive
    WHERE valeur.id = archive.valeur_id AND valeur.id IN (11979624,12374017);
    ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_by;
    ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_at;
    ALTER TABLE public.indicateur_valeur ENABLE TRIGGER verifier_periodicite_valeur_indicateur;

    IF EXISTS (
        SELECT FROM margny_monthly_values expected
        JOIN private.indicateur_valeur_date_repair archive ON archive.valeur_id = expected.valeur_id
        LEFT JOIN public.indicateur_valeur valeur ON valeur.id = expected.valeur_id
        WHERE CASE WHEN archive.apres IS NULL THEN valeur.id IS NOT NULL
                   ELSE to_jsonb(valeur) IS DISTINCT FROM
                       (archive.apres || jsonb_build_object('periodicite','annuelle')) END
    ) OR EXISTS (SELECT FROM public.indicateur_definition
                 WHERE id IN (31816,32392) AND periodicite <> 'annuelle') THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Margny : retour arrière incomplet';
    END IF;
END $margny$;
COMMIT;

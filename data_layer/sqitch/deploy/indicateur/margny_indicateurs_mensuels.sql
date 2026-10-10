-- Deploy tet:indicateur/margny_indicateurs_mensuels to pg
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

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_constraint
        WHERE conrelid IN ('public.indicateur_definition'::regclass, 'public.indicateur_valeur'::regclass)
          AND conname IN ('indicateur_definition_schema_annuel', 'indicateur_valeur_schema_annuel')) THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Déployer et valider l activation avant la conversion de Margny';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_trigger
        WHERE tgrelid = 'public.indicateur_valeur'::regclass
          AND tgname = 'verifier_periodicite_valeur_indicateur' AND tgenabled = 'O') THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Le contrat de cadence des valeurs doit être actif';
    END IF;
END $$;

-- Reprise métier des six observations de Margny : les années 2025MM étaient
-- des mois. #5220 a gardé leurs images complètes pendant la livraison annuelle.
-- Cette correction ciblée ne rend pas la périodicité modifiable par les API.
CREATE TEMP TABLE margny_monthly_values (
    valeur_id integer PRIMARY KEY,
    indicateur_id integer NOT NULL,
    mois integer NOT NULL,
    resultat double precision,
    objectif double precision,
    kept_annually boolean NOT NULL
) ON COMMIT DROP;
INSERT INTO margny_monthly_values VALUES
    (11979621, 31816, 1, 5, 3, false),
    (11979622, 31816, 2, 7, 5, false),
    (11979623, 31816, 3, 2, 7, false),
    (11979624, 31816, 4, 8, 9, true),
    (12374016, 32392, 11, NULL, 2, false),
    (12374017, 32392, 12, NULL, 3, true);

DO $margny$
BEGIN
    -- Ne rien créer dans les environnements qui n'ont pas ces indicateurs.
    IF NOT EXISTS (SELECT FROM private.indicateur_valeur_date_repair
                   WHERE valeur_id IN (SELECT valeur_id FROM margny_monthly_values))
       AND NOT EXISTS (SELECT FROM public.indicateur_definition
                       WHERE id IN (31816, 32392) AND collectivite_id = 2181) THEN
        RETURN;
    END IF;

    IF (SELECT count(*) FROM private.indicateur_valeur_date_repair
        WHERE valeur_id IN (SELECT valeur_id FROM margny_monthly_values)) <> 6
       OR (SELECT count(*) FROM public.indicateur_definition
           WHERE id IN (31816, 32392) AND collectivite_id = 2181
             AND periodicite = 'annuelle' AND identifiant_referentiel IS NULL
             AND valeur_calcule IS NULL) <> 2 THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Margny : les six originaux et les deux définitions annuelles sont requis';
    END IF;

    -- Les liens de fiches et les identifiants sont conservés. Un groupe, une
    -- formule ou un score impose en revanche une nouvelle décision métier.
    IF EXISTS (SELECT FROM public.indicateur_groupe WHERE parent IN (31816, 32392) OR enfant IN (31816, 32392))
       OR EXISTS (SELECT FROM private.indicateur_definition_dependance_calcul WHERE indicateur_id IN (31816, 32392))
       OR EXISTS (SELECT FROM public.action_score_indicateur_valeur WHERE indicateur_valeur_id IN (SELECT valeur_id FROM margny_monthly_values))
       OR EXISTS (SELECT FROM public.indicateur_valeur
                  WHERE indicateur_id IN (31816, 32392)
                    AND id NOT IN (11979624, 12374017)) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Margny : des observations ou dépendances nouvelles nécessitent une décision avant conversion';
    END IF;

    IF EXISTS (
        SELECT FROM margny_monthly_values expected
        JOIN private.indicateur_valeur_date_repair archive ON archive.valeur_id = expected.valeur_id
        LEFT JOIN public.indicateur_valeur valeur ON valeur.id = expected.valeur_id
        WHERE (archive.avant->>'id')::integer IS DISTINCT FROM expected.valeur_id
           OR (archive.avant->>'indicateur_id')::integer IS DISTINCT FROM expected.indicateur_id
           OR (archive.avant->>'collectivite_id')::integer IS DISTINCT FROM 2181
           OR (archive.avant->>'date_valeur')::date IS DISTINCT FROM make_date(202500 + expected.mois, 1, 1)
           OR (archive.avant->>'resultat')::double precision IS DISTINCT FROM expected.resultat
           OR (archive.avant->>'objectif')::double precision IS DISTINCT FROM expected.objectif
           OR archive.avant->>'metadonnee_id' IS NOT NULL
           OR (archive.avant->>'calcul_auto')::boolean IS DISTINCT FROM false
           OR CASE WHEN expected.kept_annually THEN
                  archive.apres IS NULL OR valeur.id IS NULL
                  OR valeur.periodicite IS DISTINCT FROM 'annuelle'
                  OR (to_jsonb(valeur) - 'periodicite') IS DISTINCT FROM archive.apres
                  OR (archive.apres->>'date_valeur')::date IS DISTINCT FROM DATE '2025-01-01'
                  OR (archive.apres - ARRAY['date_valeur', 'modified_at', 'modified_by'])
                     IS DISTINCT FROM (archive.avant - ARRAY['date_valeur', 'modified_at', 'modified_by'])
              ELSE archive.apres IS NOT NULL OR valeur.id IS NOT NULL END
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Margny : archive inattendue, identifiant réutilisé ou saisie modifiée depuis la réparation';
    END IF;

    CREATE TEMP TABLE margny_definitions_before ON COMMIT DROP AS
    SELECT id, to_jsonb(definition) AS image FROM public.indicateur_definition definition
    WHERE id IN (31816, 32392);

    -- Dérogation ponctuelle à l'immuabilité sous les verrous exclusifs. Les
    -- dépendances restent validées ; les images sont comparées après
    -- conversion, provenance et métadonnées comprises.
    ALTER TABLE public.indicateur_definition DISABLE TRIGGER empecher_changement_periodicite_indicateur;
    ALTER TABLE public.indicateur_definition DISABLE TRIGGER modified_at;
    ALTER TABLE public.indicateur_definition DISABLE TRIGGER modified_by;
    UPDATE public.indicateur_definition SET periodicite = 'mensuelle'
    WHERE id IN (31816, 32392) AND collectivite_id = 2181;
    ALTER TABLE public.indicateur_definition ENABLE TRIGGER modified_by;
    ALTER TABLE public.indicateur_definition ENABLE TRIGGER modified_at;
    ALTER TABLE public.indicateur_definition ENABLE TRIGGER empecher_changement_periodicite_indicateur;

    ALTER TABLE public.indicateur_valeur DISABLE TRIGGER verifier_periodicite_valeur_indicateur;
    ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_at;
    ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_by;
    INSERT INTO public.indicateur_valeur
    SELECT restored.*
    FROM margny_monthly_values expected
    JOIN private.indicateur_valeur_date_repair archive ON archive.valeur_id = expected.valeur_id
    CROSS JOIN LATERAL jsonb_populate_record(NULL::public.indicateur_valeur,
        archive.avant || jsonb_build_object('periodicite', 'mensuelle',
                                          'date_valeur', make_date(2025, expected.mois, 1))) restored
    ON CONFLICT (id) DO UPDATE SET
        periodicite = EXCLUDED.periodicite, date_valeur = EXCLUDED.date_valeur,
        modified_at = EXCLUDED.modified_at, modified_by = EXCLUDED.modified_by;
    ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_by;
    ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_at;
    ALTER TABLE public.indicateur_valeur ENABLE TRIGGER verifier_periodicite_valeur_indicateur;

    IF EXISTS (
        SELECT FROM margny_monthly_values expected
        JOIN private.indicateur_valeur_date_repair archive ON archive.valeur_id = expected.valeur_id
        LEFT JOIN public.indicateur_valeur valeur ON valeur.id = expected.valeur_id
        WHERE to_jsonb(valeur) IS DISTINCT FROM
            (archive.avant || jsonb_build_object('periodicite', 'mensuelle',
                                                 'date_valeur', make_date(2025, expected.mois, 1)))
    ) OR EXISTS (
        SELECT FROM margny_definitions_before original
        LEFT JOIN public.indicateur_definition definition ON definition.id = original.id
        WHERE to_jsonb(definition) IS DISTINCT FROM (original.image || jsonb_build_object('periodicite', 'mensuelle'))
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Margny : la conversion mensuelle doit préserver intégralement observations et définitions';
    END IF;
END
$margny$;

COMMIT;

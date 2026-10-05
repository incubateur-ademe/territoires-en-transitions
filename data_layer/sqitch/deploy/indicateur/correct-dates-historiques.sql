-- Deploy tet:indicateur/correct-dates-historiques to pg
-- requires: referentiel/action_score_indicateur_valeur

BEGIN;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL DateStyle = 'ISO, YMD';
SET LOCAL extra_float_digits = 3;
-- Refuse une vue filtrée par RLS ; ce réglage ne contourne pas les politiques.
SET LOCAL row_security = off;
SET LOCAL lock_timeout = '5s';

-- Décisions métier explicites du 28 septembre 2026. Après export des six
-- originaux de Margny, conserver seulement les observations 11979624 et 12374017
-- au 1er janvier 2025. Les quatre autres sont archivées avant suppression.
-- Aucun choix automatique de dernière valeur ni agrégation à partir des dates.
-- Empreintes SHA-256 des images JSONB complètes approuvées, vérifiées sur la
-- sauvegarde du 29 septembre (UTC, ISO/YMD, extra_float_digits=3). Les auteurs
-- et commentaires ne sont pas publiés. Une modification sans modified_at
-- invalide aussi cette approbation ; ne jamais recalculer ces empreintes au deploy.
CREATE TEMP TABLE indicateur_date_repairs (
    valeur_id integer PRIMARY KEY,
    indicateur_id integer NOT NULL,
    collectivite_id integer NOT NULL,
    date_avant date NOT NULL,
    date_apres date,
    modified_at_avant timestamptz NOT NULL,
    avant_sha256 text NOT NULL CHECK (avant_sha256 ~ '^[0-9a-f]{64}$')
) ON COMMIT DROP;
INSERT INTO indicateur_date_repairs VALUES
    (24464, 135, 1466, DATE '0001-01-01 BC', DATE '2024-01-01', TIMESTAMPTZ '2023-09-08 14:20:15.021497+00', 'aaad328030ceaadefbddf8fa12d88f7fe074e01e5b8a0af2a5c197305316c2dc'),
    (27353, 333, 3830, DATE '0001-01-01 BC', NULL, TIMESTAMPTZ '2024-12-16 10:57:34.65994+00', '03e40a7af2940101ec8fd8847074efc525cba141405a374f91f2dddd0938342e'),
    (287811340, 45906, 5596, DATE '20225-01-01', NULL, TIMESTAMPTZ '2026-03-05 10:12:11.546324+00', '1565ee163f0c2afa0367bbcd6a461a6134e99d98a41b34aebd59977458e09b30'),
    (11979621, 31816, 2181, DATE '202501-01-01', NULL::date, TIMESTAMPTZ '2025-08-05 10:00:27.486379+00', '285c74c44723b09be32364e9acb969f09a4f188d5d3119b1418b03000d6660ab'),
    (11979622, 31816, 2181, DATE '202502-01-01', NULL::date, TIMESTAMPTZ '2025-08-05 10:00:29.529076+00', '34e531a87b75c071fe987b5a64dfb961b149a2652c7b45b656539447b1678de1'),
    (11979623, 31816, 2181, DATE '202503-01-01', NULL::date, TIMESTAMPTZ '2025-08-05 10:00:31.201245+00', 'd232258cddfe45e75ac8a7cb1789d91f7836f7aa6f4116330c07050d25e01c45'),
    (11979624, 31816, 2181, DATE '202504-01-01', DATE '2025-01-01', TIMESTAMPTZ '2025-08-05 10:00:34.413885+00', 'c55746fba7836867ef51dae13d3328cd26765aca111f5b13c01b3a42ae6f0a01'),
    (12374016, 32392, 2181, DATE '202511-01-01', NULL::date, TIMESTAMPTZ '2025-09-04 19:49:53.948972+00', '181025fb4ca0245504e212b93cfe456d383948bcd9c8c89c0d40edfa71faa326'),
    (12374017, 32392, 2181, DATE '202512-01-01', DATE '2025-01-01', TIMESTAMPTZ '2025-09-04 19:50:03.704695+00', '6c74ce551b7faea6c736a60df39b4c95748b0b2035487ab5abd491a70cc5929c');

-- Archive administrative, sans FK : les six observations supprimées doivent
-- rester restaurables. Aucun accès par les rôles applicatifs.
CREATE TABLE IF NOT EXISTS private.indicateur_valeur_date_repair (
    valeur_id integer PRIMARY KEY,
    avant jsonb NOT NULL,
    apres jsonb,
    repaired_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((avant->>'id')::integer = valeur_id),
    CHECK (apres IS NULL OR (apres->>'id')::integer = valeur_id)
);
REVOKE ALL ON private.indicateur_valeur_date_repair FROM PUBLIC;
DO $permissions$
DECLARE role_name text;
BEGIN
    FOR role_name IN SELECT rolname FROM pg_roles
        WHERE rolname IN ('anon', 'authenticated', 'service_role')
    LOOP
        EXECUTE format('REVOKE ALL ON private.indicateur_valeur_date_repair FROM %I', role_name);
    END LOOP;
END;
$permissions$;
ALTER TABLE private.indicateur_valeur_date_repair ENABLE ROW LEVEL SECURITY;

LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE private.indicateur_valeur_date_repair IN SHARE ROW EXCLUSIVE MODE;

DO $preflight$
BEGIN
    -- Les verrous de ligne empêchent aussi de créer une référence FK pendant
    -- le contrôle précédant les suppressions.
    PERFORM v.id FROM public.indicateur_valeur v
    JOIN indicateur_date_repairs r ON r.valeur_id = v.id
    FOR UPDATE OF v;

    IF EXISTS (
        SELECT 1 FROM private.indicateur_valeur_date_repair a
        LEFT JOIN public.indicateur_valeur v ON v.id = a.valeur_id
        WHERE CASE WHEN a.apres IS NULL THEN v.id IS NOT NULL
                   ELSE to_jsonb(v) IS DISTINCT FROM a.apres END
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Une observation réparée a changé : rejeu refusé';
    END IF;

    -- Des identifiants absents dans un autre environnement ne sont pas créés.
    -- Une correction déjà faite manuellement reste inchangée et non archivée.
    IF EXISTS (
        SELECT 1 FROM indicateur_date_repairs r
        JOIN public.indicateur_valeur v ON v.id = r.valeur_id
        LEFT JOIN private.indicateur_valeur_date_repair a ON a.valeur_id = v.id
        WHERE a.valeur_id IS NULL AND (
            v.indicateur_id <> r.indicateur_id OR v.collectivite_id <> r.collectivite_id
            OR v.metadonnee_id IS NOT NULL OR v.calcul_auto IS DISTINCT FROM false
            OR (v.date_valeur IS DISTINCT FROM r.date_avant
                AND v.date_valeur IS DISTINCT FROM r.date_apres)
            OR (v.date_valeur = r.date_avant AND (
                v.modified_at IS DISTINCT FROM r.modified_at_avant
                OR encode(sha256(convert_to(to_jsonb(v)::text, 'UTF8')), 'hex')
                    IS DISTINCT FROM r.avant_sha256
            ))
        )
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Identité ou état initial inattendu pour une observation à réparer';
    END IF;

    IF EXISTS (
        SELECT 1 FROM indicateur_date_repairs r
        JOIN public.indicateur_valeur v ON v.id = r.valeur_id
        JOIN public.indicateur_valeur other ON other.id <> v.id
            AND other.indicateur_id = v.indicateur_id
            AND other.collectivite_id = v.collectivite_id
            AND other.metadonnee_id IS NOT DISTINCT FROM v.metadonnee_id
            AND other.date_valeur = r.date_apres
        WHERE r.date_apres IS NOT NULL AND v.date_valeur = r.date_avant
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23505',
            MESSAGE = 'La date approuvée entre en collision avec une autre observation';
    END IF;

    IF EXISTS (
        SELECT 1 FROM indicateur_date_repairs r
        JOIN public.indicateur_valeur v ON v.id = r.valeur_id
        JOIN public.action_score_indicateur_valeur s ON s.indicateur_valeur_id = v.id
        WHERE r.date_apres IS NULL
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23503',
            MESSAGE = 'Une observation à supprimer est utilisée par un score : réparation refusée';
    END IF;
END;
$preflight$;

INSERT INTO private.indicateur_valeur_date_repair (valeur_id, avant)
SELECT v.id, to_jsonb(v)
FROM public.indicateur_valeur v
JOIN indicateur_date_repairs r ON r.valeur_id = v.id AND r.date_avant = v.date_valeur
WHERE NOT EXISTS (SELECT 1 FROM private.indicateur_valeur_date_repair a WHERE a.valeur_id = v.id);

WITH changed AS (
    UPDATE public.indicateur_valeur v SET date_valeur = r.date_apres
    FROM indicateur_date_repairs r, private.indicateur_valeur_date_repair a
    WHERE v.id = r.valeur_id AND a.valeur_id = v.id
      AND r.date_apres IS NOT NULL AND v.date_valeur = r.date_avant
    RETURNING v.*
)
UPDATE private.indicateur_valeur_date_repair a SET apres = to_jsonb(changed)
FROM changed WHERE a.valeur_id = changed.id;

DELETE FROM public.indicateur_valeur v USING indicateur_date_repairs r,
    private.indicateur_valeur_date_repair a
WHERE v.id = r.valeur_id AND a.valeur_id = v.id
  AND r.date_apres IS NULL AND to_jsonb(v) = a.avant;

-- L'archive ne suffit pas à prouver qu'un DELETE/UPDATE a réellement eu lieu.
-- Un trigger qui ignore une écriture doit annuler tout le lot, archive comprise.
DO $postflight$
BEGIN
    IF EXISTS (
        SELECT 1 FROM private.indicateur_valeur_date_repair a
        JOIN indicateur_date_repairs r ON r.valeur_id = a.valeur_id
        LEFT JOIN public.indicateur_valeur v ON v.id = a.valeur_id
        WHERE CASE WHEN r.date_apres IS NULL THEN v.id IS NOT NULL
                   ELSE a.apres IS NULL
                        OR (a.apres->>'date_valeur')::date IS DISTINCT FROM r.date_apres
                        OR to_jsonb(v) IS DISTINCT FROM a.apres END
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Une réparation attendue n’a pas été appliquée : migration annulée';
    END IF;
END;
$postflight$;

COMMIT;

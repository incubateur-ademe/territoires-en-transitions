BEGIN;
SELECT plan(11);
CREATE TEMP TABLE release_collectivite AS
WITH inserted AS (
    INSERT INTO public.collectivite (nom, type) VALUES ('Livraison annuelle', 'epci') RETURNING id
) SELECT id FROM inserted;
CREATE TEMP TABLE release_indicateur AS
WITH inserted AS (
    INSERT INTO public.indicateur_definition (titre, unite) VALUES ('Livraison annuelle', 'kWh') RETURNING id
) SELECT id FROM inserted;
SELECT is((SELECT periodicite FROM public.indicateur_definition WHERE id = (SELECT id FROM release_indicateur)), 'annuelle', 'Une définition reste annuelle par défaut');
SELECT lives_ok($sql$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, date_valeur, resultat)
    SELECT c.id, i.id, DATE '2024-01-01', 0 FROM release_collectivite c CROSS JOIN release_indicateur i
$sql$, 'Une valeur annuelle nulle au sens numérique est enregistrable');
SELECT lives_ok($sql$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, periodicite, date_valeur, resultat)
    SELECT c.id, i.id, 'annuelle', DATE '2024-01-01', 1 FROM release_collectivite c CROSS JOIN release_indicateur i
    ON CONFLICT (indicateur_id, collectivite_id, periodicite, date_valeur)
        WHERE metadonnee_id IS NULL
    DO UPDATE SET resultat = EXCLUDED.resultat
$sql$, 'L upsert annuel utilise l index incluant la périodicité');
SELECT lives_ok($sql$
    INSERT INTO public.indicateur_definition (titre, unite, periodicite) VALUES ('Mensuel', 'kWh', 'mensuelle')
$sql$, 'La seconde livraison accepte les définitions mensuelles');
SELECT lives_ok($sql$
    INSERT INTO public.indicateur_definition (titre, unite, periodicite) VALUES ('Trimestriel', 'kWh', 'trimestrielle')
$sql$, 'La seconde livraison accepte les définitions trimestrielles');
SELECT lives_ok($sql$
    INSERT INTO public.indicateur_definition (titre, unite, periodicite) VALUES ('Semestriel', 'kWh', 'semestrielle')
$sql$, 'La seconde livraison accepte les définitions semestrielles');
SELECT throws_ok($sql$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, date_valeur, periodicite, metadonnee_id, resultat)
    SELECT c.id, i.id, DATE '2024-01-01', 'mensuelle', NULL, 42 FROM release_collectivite c CROSS JOIN release_indicateur i
$sql$, '23514', NULL, 'Une valeur locale doit toujours respecter la cadence de sa définition');
SELECT hasnt_column('public', 'indicateur_definition', 'aggregation_resultat',
    'La restitution ne propose pas d’agrégation temporelle');
SELECT is(
    (SELECT array_agg(attname::text ORDER BY attnum)
     FROM pg_attribute
     WHERE attrelid = 'stats.report_indicateur_resultat'::regclass
       AND attnum > 0 AND NOT attisdropped),
    ARRAY['collectivite_id', 'code_siren_insee', 'nom', 'indicateur_id', 'annee', 'resultat', 'periodicite', 'periode_debut']::text[],
    'L activation ajoute les périodes après les colonnes historiques du reporting'
);
CREATE TEMP TABLE release_metadata AS
WITH source AS (
    INSERT INTO public.indicateur_source (id, libelle)
    VALUES ('release-cadences', 'Cadences de la source') RETURNING id
), metadata AS (
    INSERT INTO public.indicateur_source_metadonnee (source_id, date_version)
    SELECT id, TIMESTAMP '2026-01-01' FROM source RETURNING id
) SELECT id FROM metadata;
SELECT lives_ok($sql$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, metadonnee_id, periodicite, date_valeur, resultat)
    SELECT c.id, i.id, m.id, cadence, DATE '2024-01-01', 1
    FROM release_collectivite c CROSS JOIN release_indicateur i CROSS JOIN release_metadata m
    CROSS JOIN (VALUES ('annuelle'), ('mensuelle')) AS cadences(cadence)
    ON CONFLICT (indicateur_id, collectivite_id, periodicite, date_valeur, metadonnee_id)
        WHERE metadonnee_id IS NOT NULL DO UPDATE SET resultat = EXCLUDED.resultat
$sql$, 'Une source conserve deux cadences au même début de période après retrait des anciens index');
SELECT ok(to_regclass('public.indicateur_periodicite') IS NULL,
    'Le contrat utilise les CHECK sans catalogue de configuration');
SELECT * FROM finish();
ROLLBACK;

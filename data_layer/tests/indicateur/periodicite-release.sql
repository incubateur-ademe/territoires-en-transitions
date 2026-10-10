BEGIN;
SELECT plan(17);
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
$sql$, 'Le nouvel upsert annuel fonctionne avec les anciens et nouveaux index présents');
SELECT throws_ok($sql$
    INSERT INTO public.indicateur_definition (titre, unite, periodicite) VALUES ('Mensuel', 'kWh', 'mensuelle')
$sql$, '23514', NULL, 'La première livraison refuse les définitions mensuelles');
SELECT throws_ok($sql$
    INSERT INTO public.indicateur_definition (titre, unite, periodicite) VALUES ('Trimestriel', 'kWh', 'trimestrielle')
$sql$, '23514', NULL, 'La première livraison refuse les définitions trimestrielles');
SELECT throws_ok($sql$
    INSERT INTO public.indicateur_definition (titre, unite, periodicite) VALUES ('Semestriel', 'kWh', 'semestrielle')
$sql$, '23514', NULL, 'La première livraison refuse les définitions semestrielles');
SELECT throws_ok($sql$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, date_valeur, periodicite, metadonnee_id, resultat)
    SELECT c.id, i.id, DATE '2024-01-01', 'mensuelle', NULL, 42 FROM release_collectivite c CROSS JOIN release_indicateur i
$sql$, '23514', NULL, 'Les écritures directes ne peuvent pas ouvrir une série mensuelle');
SELECT throws_ok($sql$
    UPDATE public.indicateur_definition SET aggregation_resultat = 'somme' WHERE id = (SELECT id FROM release_indicateur)
$sql$, '23514', NULL, 'L agrégation reste fermée');
SELECT is(
    (SELECT array_agg(attname::text ORDER BY attnum)
     FROM pg_attribute
     WHERE attrelid = 'stats.report_indicateur_resultat'::regclass
       AND attnum > 0 AND NOT attisdropped),
    ARRAY['collectivite_id', 'code_siren_insee', 'nom', 'indicateur_id', 'annee', 'resultat']::text[],
    'La livraison annuelle conserve le contrat historique du reporting'
);
SELECT ok(to_regclass('public.indicateur_periodicite') IS NULL,
    'La livraison annuelle ne conserve pas de catalogue de configuration inutilisé');

-- Isole les nouveaux CHECK des garde-fous annuels : ce bloc est annulé au ROLLBACK.
ALTER TABLE public.indicateur_definition DROP CONSTRAINT indicateur_definition_schema_annuel;
ALTER TABLE public.indicateur_valeur DROP CONSTRAINT indicateur_valeur_schema_annuel;
SELECT lives_ok($sql$
    UPDATE public.indicateur_definition SET periodicite = 'annuelle'
    WHERE id = (SELECT id FROM release_indicateur)
$sql$, 'Le CHECK de définition accepte la cadence annuelle');
SELECT lives_ok($sql$
    UPDATE public.indicateur_valeur SET periodicite = 'annuelle'
    WHERE indicateur_id = (SELECT id FROM release_indicateur)
$sql$, 'Le CHECK de valeur accepte la cadence annuelle');
SELECT throws_ok($sql$
    UPDATE public.indicateur_definition SET periodicite = 'mensuelle'
    WHERE id = (SELECT id FROM release_indicateur)
$sql$, '23514', NULL, 'Le nouveau CHECK refuse seul une définition non annuelle');
SELECT throws_ok($sql$
    UPDATE public.indicateur_valeur SET periodicite = 'mensuelle'
    WHERE indicateur_id = (SELECT id FROM release_indicateur)
$sql$, '23514', NULL, 'Le nouveau CHECK refuse seul une valeur non annuelle');
SELECT throws_ok($sql$
    UPDATE public.indicateur_definition SET periodicite = 'hebdomadaire'
    WHERE id = (SELECT id FROM release_indicateur)
$sql$, '23514', NULL, 'Le CHECK refuse une cadence inconnue sur la définition');
SELECT throws_ok($sql$
    UPDATE public.indicateur_valeur SET periodicite = 'hebdomadaire'
    WHERE indicateur_id = (SELECT id FROM release_indicateur)
$sql$, '23514', NULL, 'Le CHECK refuse une cadence inconnue sur la valeur');
SELECT lives_ok($sql$
    SET LOCAL ROLE authenticated;
    UPDATE public.indicateur_valeur SET resultat = resultat WHERE false;
    RESET ROLE;
$sql$, 'Les intégrations authentifiées conservent leur droit d’écriture avec les verrous SQL');
SELECT * FROM finish();
ROLLBACK;

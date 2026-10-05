BEGIN;
SELECT plan(7);
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
SELECT * FROM finish();
ROLLBACK;

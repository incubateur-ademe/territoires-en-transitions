BEGIN;
SELECT plan(17);

CREATE TEMP TABLE declaration_collectivite AS
WITH inserted AS (
    INSERT INTO public.collectivite (nom, type)
    VALUES ('Déclaration à cadence fixe', 'epci')
    RETURNING id
) SELECT id FROM inserted;

CREATE TEMP TABLE declaration_indicateurs AS
WITH inserted AS (
    INSERT INTO public.indicateur_definition (titre, unite, periodicite)
    VALUES ('Annuel', 'kWh', 'annuelle'),
           ('Semestriel', 'kWh', 'semestrielle'),
           ('Trimestriel', 'kWh', 'trimestrielle'),
           ('Mensuel', 'kWh', 'mensuelle')
    RETURNING id, periodicite
) SELECT * FROM inserted;

SELECT throws_ok(format(
    $$ UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = %s $$,
    (SELECT id FROM declaration_indicateurs WHERE periodicite = 'annuelle')
), '23514', NULL, 'La cadence est immuable dès création, même sans déclaration');

SELECT lives_ok($$
    INSERT INTO public.indicateur_valeur
        (collectivite_id, indicateur_id, periodicite, date_valeur, resultat)
    SELECT c.id, i.id, i.periodicite, DATE '2026-01-01', 10
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i
$$, 'Les quatre cadences acceptent leur début canonique');

SELECT throws_ok($$
    INSERT INTO public.indicateur_valeur
        (collectivite_id, indicateur_id, periodicite, date_valeur, resultat)
    SELECT c.id, i.id, 'mensuelle', DATE '2026-02-01', 10
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i
    WHERE i.periodicite = 'annuelle'
$$, '23514', 'La déclaration locale doit respecter la périodicité de sa définition',
    'Une déclaration locale ne peut pas contourner la cadence de la définition');

SELECT throws_ok($$
    UPDATE public.indicateur_valeur SET periodicite = 'mensuelle'
    WHERE indicateur_id = (SELECT id FROM declaration_indicateurs WHERE periodicite = 'annuelle')
$$, '23514', 'La périodicité d''une valeur enregistrée est immuable',
    'Une valeur enregistrée ne peut pas être réinterprétée');

INSERT INTO public.indicateur_source (id, libelle) VALUES ('test-cadence-originale', 'Source externe');
CREATE TEMP TABLE declaration_source AS
WITH inserted AS (
    INSERT INTO public.indicateur_source_metadonnee (source_id, date_version)
    VALUES ('test-cadence-originale', '2026-01-01') RETURNING id
) SELECT id FROM inserted;

SELECT lives_ok($$
    INSERT INTO public.indicateur_valeur
        (collectivite_id, indicateur_id, periodicite, date_valeur, resultat, metadonnee_id)
    SELECT c.id, i.id, p.code, DATE '2026-01-01', 120, s.id
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i
    CROSS JOIN (VALUES ('annuelle'), ('semestrielle'), ('trimestrielle'), ('mensuelle')) p(code)
    CROSS JOIN declaration_source s
    WHERE i.periodicite = 'mensuelle'
$$, 'Les sources externes conservent leurs cadences originales sur les mêmes dates');

SELECT is((SELECT count(*) FROM public.indicateur_valeur v
           JOIN declaration_indicateurs i ON v.indicateur_id = i.id
           WHERE i.periodicite = 'mensuelle'), 5::bigint,
          'Les quatre observations externes et la déclaration mensuelle restent distinctes');

SELECT throws_ok($$
    INSERT INTO public.indicateur_valeur
        (collectivite_id, indicateur_id, periodicite, date_valeur, resultat, metadonnee_id)
    SELECT c.id, i.id, 'annuelle', DATE '2026-01-01', 121, s.id
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i CROSS JOIN declaration_source s
    WHERE i.periodicite = 'mensuelle'
$$, '23505', NULL, 'Une même source ne peut pas publier deux valeurs pour la même période');

SELECT throws_ok($$
    UPDATE public.indicateur_valeur SET metadonnee_id = NULL
    WHERE indicateur_id = (SELECT id FROM declaration_indicateurs WHERE periodicite = 'mensuelle')
      AND periodicite = 'annuelle'
$$, '23514', 'La déclaration locale doit respecter la périodicité de sa définition',
    'Une source externe annuelle ne devient pas une déclaration locale mensuelle');

SELECT lives_ok($$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, periodicite, date_valeur, resultat)
    SELECT c.id, i.id, i.periodicite, DATE '2026-04-01', 0
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i WHERE i.periodicite = 'trimestrielle'
$$, 'La déclaration du deuxième trimestre accepte zéro');
SELECT lives_ok($$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, periodicite, date_valeur, resultat)
    SELECT c.id, i.id, i.periodicite, DATE '2026-07-01', 0
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i WHERE i.periodicite = 'semestrielle'
$$, 'La déclaration du deuxième semestre accepte zéro');

SELECT throws_ok($$
    INSERT INTO public.indicateur_definition (titre, unite, periodicite)
    VALUES ('Cadence inconnue', 'kWh', 'hebdomadaire')
$$, '23514', NULL, 'La base refuse une périodicité inconnue à la création');

SELECT hasnt_column('public', 'indicateur_definition', 'aggregation_resultat',
    'Aucune règle d’agrégation temporelle des résultats');
SELECT hasnt_column('public', 'indicateur_definition', 'aggregation_objectif',
    'Aucune règle d’agrégation temporelle des objectifs');

-- La saisie du diagnostic PCAET porte une métadonnée interne, contrairement
-- aux données importées de la source externe pcaet.
INSERT INTO public.indicateur_source (id, libelle)
VALUES ('pcaet-collectivite', 'PCAET collectivité'), ('pcaet', 'PCAET importé')
ON CONFLICT (id) DO NOTHING;
CREATE TEMP TABLE declaration_pcaet_sources AS
WITH inserted AS (
    INSERT INTO public.indicateur_source_metadonnee (source_id, date_version)
    VALUES ('pcaet-collectivite', '2026-01-01'), ('pcaet', '2026-01-01')
    RETURNING id, source_id
) SELECT * FROM inserted;

SELECT lives_ok($$
    INSERT INTO public.indicateur_valeur
        (collectivite_id, indicateur_id, periodicite, date_valeur, resultat, metadonnee_id)
    SELECT c.id, i.id, 'annuelle', DATE '2027-01-01', 10, s.id
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i
    CROSS JOIN declaration_pcaet_sources s
    WHERE i.periodicite = 'annuelle' AND s.source_id = 'pcaet-collectivite'
$$, 'Une déclaration annuelle du diagnostic PCAET respecte sa définition annuelle');

SELECT throws_ok($$
    INSERT INTO public.indicateur_valeur
        (collectivite_id, indicateur_id, periodicite, date_valeur, resultat, metadonnee_id)
    SELECT c.id, i.id, 'annuelle', DATE '2027-01-01', 10, s.id
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i
    CROSS JOIN declaration_pcaet_sources s
    WHERE i.periodicite = 'mensuelle' AND s.source_id = 'pcaet-collectivite'
$$, '23514', 'La déclaration locale doit respecter la périodicité de sa définition',
    'La métadonnée interne PCAET ne contourne pas la cadence de déclaration');

SELECT lives_ok($$
    INSERT INTO public.indicateur_valeur
        (collectivite_id, indicateur_id, periodicite, date_valeur, resultat, metadonnee_id)
    SELECT c.id, i.id, 'annuelle', DATE '2027-01-01', 10, s.id
    FROM declaration_collectivite c CROSS JOIN declaration_indicateurs i
    CROSS JOIN declaration_pcaet_sources s
    WHERE i.periodicite = 'mensuelle' AND s.source_id = 'pcaet'
$$, 'La source PCAET externe conserve sa cadence annuelle pour une définition mensuelle');

SELECT throws_ok($$
    UPDATE public.indicateur_valeur
    SET metadonnee_id = (SELECT id FROM declaration_pcaet_sources WHERE source_id = 'pcaet-collectivite')
    WHERE indicateur_id = (SELECT id FROM declaration_indicateurs WHERE periodicite = 'mensuelle')
      AND metadonnee_id = (SELECT id FROM declaration_pcaet_sources WHERE source_id = 'pcaet')
$$, '23514', 'La déclaration locale doit respecter la périodicité de sa définition',
    'Une observation importée ne devient pas une déclaration PCAET à cadence incompatible');

SELECT * FROM finish();
ROLLBACK;

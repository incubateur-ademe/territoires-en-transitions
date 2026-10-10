BEGIN;

SELECT plan(22);

CREATE TEMPORARY TABLE test_collectivite_periodicite AS
WITH collectivite AS (
    INSERT INTO public.collectivite (nom, type)
    VALUES ('Collectivité périodicité indicateur', 'epci')
    RETURNING id
)
SELECT id AS collectivite_id
FROM collectivite;

CREATE TEMPORARY TABLE test_indicateur_periodicite AS
WITH indicateurs AS (
    INSERT INTO public.indicateur_definition
        (collectivite_id, identifiant_referentiel, titre, unite, periodicite)
    SELECT collectivite.collectivite_id,
           donnees.referentiel_id,
           donnees.code,
           'kWh',
           donnees.periodicite
    FROM test_collectivite_periodicite collectivite
    CROSS JOIN (VALUES
        ('test-annuel', NULL, 'annuelle'),
        ('test-sans-valeur', NULL, 'annuelle'),
        ('test-mensuel', NULL, 'mensuelle')
    ) AS donnees(code, referentiel_id, periodicite)
    RETURNING id, titre, periodicite
)
SELECT id, titre AS code, periodicite
FROM indicateurs;

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_definition
               (collectivite_id, titre, unite)
           VALUES (%s, 'test-periodicite-absente', 'kWh') $$,
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Une définition qui omet la périodicité conserve le défaut annuel'
);

SELECT ok(to_regclass('public.indicateur_periodicite') IS NULL,
    'Les cadences fixes ne nécessitent plus de catalogue de configuration');
SELECT has_check('public', 'indicateur_definition',
    'Les définitions conservent leur contrainte de cadence');
SELECT has_check('public', 'indicateur_valeur',
    'Les valeurs conservent leur contrainte de cadence');
SELECT ok(to_regproc('public.indicateurs_gaz_effet_serre') IS NULL,
    'La migration ne recrée pas le RPC GES retiré au profit du backend');

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_valeur
               (indicateur_id, collectivite_id, date_valeur, resultat)
           VALUES (%s, %s, DATE '2027-01-01', 1) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Une valeur annuelle au 1er janvier est acceptée directement en base'
);





SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET periodicite = 'mensuelle'
           WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel')
    ),
    23514,
    NULL,
    'La périodicité de déclaration reste immuable avec des valeurs'
);

SELECT lives_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET periodicite = 'annuelle'
           WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel')
    ),
    'Réécrire la même périodicité reste autorisé'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-sans-valeur')
    ),
    'Un groupe de définitions annuelles homogènes est accepté'
);

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-sans-valeur')
    ),
    23514,
    NULL,
    'Une définition liée ne peut pas rendre son groupe hétérogène'
);

DELETE FROM public.indicateur_groupe
WHERE enfant = (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-sans-valeur');

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-sans-valeur')
    ),
    23514,
    NULL,
    'La périodicité reste immuable même sans groupe ni valeur'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-mensuel')
    ),
    23514,
    NULL,
    'Un groupe ne peut pas agréger des définitions de périodicités différentes'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_valeur
               (indicateur_id, collectivite_id, date_valeur, resultat, periodicite)
           VALUES (%s, %s, DATE '2027-01-01', 10, 'mensuelle') $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-mensuel'),
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Le premier jour de janvier est accepté pour un indicateur mensuel'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_valeur
               (indicateur_id, collectivite_id, date_valeur, resultat, periodicite)
           VALUES (%s, %s, DATE '2027-02-01', 20, 'mensuelle') $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-mensuel'),
        (SELECT collectivite_id FROM test_collectivite_periodicite)
    ),
    'Le premier jour de février est accepté pour un indicateur mensuel'
);



SELECT is(
    (
        SELECT count(*)::integer
        FROM public.indicateur_valeur
        WHERE indicateur_id = (
            SELECT id
            FROM test_indicateur_periodicite
            WHERE code = 'test-mensuel'
        )
    ),
    2,
    'Janvier et février restent deux valeurs indépendantes'
);


SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET periodicite = 'annuelle'
           WHERE id = %s $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-mensuel')
    ),
    23514,
    NULL,
    'Une définition mensuelle alimentée ne peut pas devenir annuelle'
);

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_valeur
           SET indicateur_id = %s
           WHERE indicateur_id = %s
             AND date_valeur = DATE '2027-02-01' $$,
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-annuel'),
        (SELECT id FROM test_indicateur_periodicite WHERE code = 'test-mensuel')
    ),
    23514,
    NULL,
    'Déplacer une valeur vers une définition de périodicité incompatible est refusé'
);


SELECT lives_ok(
    $$ REFRESH MATERIALIZED VIEW stats.collectivite $$,
    'La collectivité de test est intégrée au socle du reporting'
);

SELECT lives_ok(
    $$ REFRESH MATERIALIZED VIEW stats.report_indicateur_resultat $$,
    'Le reporting des résultats peut être rafraîchi avec des valeurs mensuelles'
);

SELECT is(
    (
        SELECT array_agg(periode_debut ORDER BY periode_debut)
        FROM stats.report_indicateur_resultat
        WHERE indicateur_id = (
            SELECT id
            FROM test_indicateur_periodicite
            WHERE code = 'test-mensuel'
        )
    ),
    ARRAY[DATE '2027-01-01', DATE '2027-02-01'],
    'Le reporting conserve les deux dates mensuelles complètes'
);

SELECT is(
    (
        SELECT array_agg(periodicite ORDER BY periode_debut)
        FROM stats.report_indicateur_resultat
        WHERE indicateur_id = (
            SELECT id
            FROM test_indicateur_periodicite
            WHERE code = 'test-mensuel'
        )
    ),
    ARRAY['mensuelle', 'mensuelle'],
    'Le reporting transporte la politique avec chaque début de période'
);

SELECT is(
    (
        SELECT array_agg(annee::integer ORDER BY periode_debut)
        FROM stats.report_indicateur_resultat
        WHERE indicateur_id = (
            SELECT id
            FROM test_indicateur_periodicite
            WHERE code = 'test-mensuel'
        )
    ),
    ARRAY[2027, 2027],
    'Le reporting conserve aussi la colonne annuelle historique'
);

SELECT * FROM finish();
ROLLBACK;

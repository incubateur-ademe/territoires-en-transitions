BEGIN;

SELECT plan(9);

CREATE TEMPORARY TABLE test_nature_context AS
WITH collectivite AS (
    INSERT INTO public.collectivite (nom, type)
    VALUES ('Collectivité nature indicateur', 'epci')
    RETURNING id
), groupement AS (
    INSERT INTO public.groupement (nom)
    VALUES ('Groupement nature indicateur')
    RETURNING id
)
SELECT collectivite.id AS collectivite_id, groupement.id AS groupement_id
FROM collectivite
CROSS JOIN groupement;

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_definition
               (collectivite_id, identifiant_referentiel, groupement_id, titre, unite)
           VALUES (%s, NULL, NULL, 'test-nature-perso', 'kWh') $$,
        (SELECT collectivite_id FROM test_nature_context)
    ),
    'Un perso porte une collectivité, sans identifiant référentiel ni groupement'
);

SELECT lives_ok(
    $$ INSERT INTO public.indicateur_definition
           (collectivite_id, identifiant_referentiel, groupement_id, titre, unite)
       VALUES (NULL, 'test-nature-predefini', NULL, 'test-nature-predefini', 'kWh') $$,
    'Un prédéfini commun porte un identifiant référentiel, sans collectivité ni groupement'
);

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_definition
               (collectivite_id, identifiant_referentiel, groupement_id, titre, unite)
           VALUES (NULL, 'test-nature-predefini-groupement', %s,
                   'test-nature-predefini-groupement', 'kWh') $$,
        (SELECT groupement_id FROM test_nature_context)
    ),
    'Un prédéfini de groupement porte un identifiant référentiel et un groupement, sans collectivité'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_definition
               (collectivite_id, identifiant_referentiel, groupement_id, titre, unite)
           VALUES (%s, 'test-nature-collectivite-et-identifiant', NULL,
                   'test-nature-collectivite-et-identifiant', 'kWh') $$,
        (SELECT collectivite_id FROM test_nature_context)
    ),
    '23514',
    'new row for relation "indicateur_definition" violates check constraint "indicateur_definition_nature_check"',
    'Une collectivité avec un identifiant référentiel est refusée'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_definition
               (collectivite_id, identifiant_referentiel, groupement_id, titre, unite)
           VALUES (%s, NULL, %s, 'test-nature-collectivite-et-groupement', 'kWh') $$,
        (SELECT collectivite_id FROM test_nature_context),
        (SELECT groupement_id FROM test_nature_context)
    ),
    '23514',
    'new row for relation "indicateur_definition" violates check constraint "indicateur_definition_nature_check"',
    'Une collectivité avec un groupement est refusée'
);

SELECT throws_ok(
    $$ INSERT INTO public.indicateur_definition
           (collectivite_id, identifiant_referentiel, groupement_id, titre, unite)
       VALUES (NULL, NULL, NULL, 'test-nature-sans-collectivite-ni-identifiant', 'kWh') $$,
    '23514',
    'new row for relation "indicateur_definition" violates check constraint "indicateur_definition_nature_check"',
    'Ni collectivité ni identifiant référentiel est refusé'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_definition
               (collectivite_id, identifiant_referentiel, groupement_id, titre, unite)
           VALUES (NULL, NULL, %s, 'test-nature-groupement-seul', 'kWh') $$,
        (SELECT groupement_id FROM test_nature_context)
    ),
    '23514',
    'new row for relation "indicateur_definition" violates check constraint "indicateur_definition_nature_check"',
    'Un groupement seul est refusé'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_definition
               (collectivite_id, identifiant_referentiel, groupement_id, titre, unite)
           VALUES (%s, 'test-nature-collectivite-identifiant-groupement', %s,
                   'test-nature-collectivite-identifiant-groupement', 'kWh') $$,
        (SELECT collectivite_id FROM test_nature_context),
        (SELECT groupement_id FROM test_nature_context)
    ),
    '23514',
    'new row for relation "indicateur_definition" violates check constraint "indicateur_definition_nature_check"',
    'Une collectivité avec un identifiant référentiel et un groupement est refusée'
);

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_definition
           SET collectivite_id = %s
           WHERE identifiant_referentiel = 'test-nature-predefini' $$,
        (SELECT collectivite_id FROM test_nature_context)
    ),
    '23514',
    'new row for relation "indicateur_definition" violates check constraint "indicateur_definition_nature_check"',
    'Rattacher un prédéfini à une collectivité est refusé'
);

SELECT * FROM finish();
ROLLBACK;

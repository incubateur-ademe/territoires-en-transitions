BEGIN;

SELECT plan(8);

CREATE TEMPORARY TABLE test_collectivites_groupe AS
WITH collectivites AS (
    INSERT INTO public.collectivite (nom, type)
    VALUES ('Collectivité groupe A', 'epci'), ('Collectivité groupe B', 'epci')
    RETURNING id, nom
)
SELECT id AS collectivite_id, nom
FROM collectivites;

CREATE TEMPORARY TABLE test_indicateurs_groupe AS
WITH indicateurs AS (
    INSERT INTO public.indicateur_definition
        (collectivite_id, identifiant_referentiel, titre, unite)
    SELECT collectivite.collectivite_id, NULL, donnees.code, 'kWh'
    FROM test_collectivites_groupe collectivite
    JOIN (VALUES
        ('test-groupe-a1', 'Collectivité groupe A'),
        ('test-groupe-a2', 'Collectivité groupe A'),
        ('test-groupe-a3', 'Collectivité groupe A'),
        ('test-groupe-b1', 'Collectivité groupe B')
    ) AS donnees(code, nom_collectivite)
        ON donnees.nom_collectivite = collectivite.nom
    RETURNING id, titre
)
SELECT id, titre AS code
FROM indicateurs;

INSERT INTO public.indicateur_definition
    (collectivite_id, identifiant_referentiel, titre, unite)
VALUES (NULL, 'test-groupe-predefini', 'test-groupe-predefini', 'kWh');

SELECT lives_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a1'),
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a2')
    ),
    'Un enfant se rattache à un parent de sa collectivité'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a3'),
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a2')
    ),
    23505,
    NULL,
    'Un enfant ne peut pas avoir deux parents'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a3'),
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a3')
    ),
    23514,
    NULL,
    'Un indicateur ne peut pas être son propre parent'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a1'),
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-b1')
    ),
    23514,
    NULL,
    'Le parent et l''enfant doivent appartenir à la même collectivité'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM public.indicateur_definition
         WHERE identifiant_referentiel = 'test-groupe-predefini'),
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a3')
    ),
    23514,
    NULL,
    'Un parent prédéfini n''accepte pas un enfant personnalisé'
);

SELECT throws_ok(
    format(
        $$ INSERT INTO public.indicateur_groupe (parent, enfant)
           VALUES (%s, %s) $$,
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a3'),
        (SELECT id FROM public.indicateur_definition
         WHERE identifiant_referentiel = 'test-groupe-predefini')
    ),
    23514,
    NULL,
    'Un enfant prédéfini n''est pas rattachable à un parent personnalisé'
);

SELECT throws_ok(
    format(
        $$ UPDATE public.indicateur_groupe
           SET parent = %s
           WHERE enfant = %s $$,
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-b1'),
        (SELECT id FROM test_indicateurs_groupe WHERE code = 'test-groupe-a2')
    ),
    23514,
    NULL,
    'Changer le parent d''un groupe revalide la collectivité'
);

SELECT lives_ok(
    $$ INSERT INTO public.indicateur_definition
           (collectivite_id, identifiant_referentiel, titre, unite)
       VALUES (NULL, 'test-groupe-predefini-enfant', 'test-groupe-predefini-enfant', 'kWh');
       INSERT INTO public.indicateur_groupe (parent, enfant)
       SELECT parent.id, enfant.id
       FROM public.indicateur_definition parent
       CROSS JOIN public.indicateur_definition enfant
       WHERE parent.identifiant_referentiel = 'test-groupe-predefini'
         AND enfant.identifiant_referentiel = 'test-groupe-predefini-enfant' $$,
    'Deux prédéfinis communs restent rattachables entre eux'
);

SELECT * FROM finish();

ROLLBACK;

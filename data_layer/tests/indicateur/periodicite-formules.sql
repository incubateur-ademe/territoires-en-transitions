BEGIN;

SELECT plan(13);

SELECT has_table(
    'private',
    'indicateur_definition_dependance_calcul',
    'La base matérialise les dépendances des formules'
);

SELECT set_eq(
    $$
        SELECT source_identifiant
        FROM private.extraire_dependances_formule_indicateur(
            'val(Test-Formule-Source) + opt_val(test-formule-source, citepa) + cible(test.formule.cible) + limite(test-formule-limite)'
        )
    $$,
    $$ VALUES
        ('test-formule-limite'::text),
        ('test-formule-source'::text),
        ('test.formule.cible'::text)
    $$,
    'L extraction suit les quatre appels de la grammaire, normalise la casse et déduplique'
);

CREATE TEMPORARY TABLE test_indicateur_periodicite_formule AS
WITH definitions AS (
    INSERT INTO public.indicateur_definition
        (identifiant_referentiel, titre, unite, periodicite)
    VALUES
        ('test-formule-source-annuelle', 'Source annuelle de formule', 'kWh', 'annuelle'),
        ('test-formule-source-mensuelle', 'Source mensuelle de formule', 'kWh', 'mensuelle'),
        ('test-formule-cible', 'Cible de formule', 'kWh', 'annuelle')
    RETURNING id, identifiant_referentiel
)
SELECT id, identifiant_referentiel
FROM definitions;

SELECT lives_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule =
            'val(test-formule-source-annuelle) + opt_val(test-formule-source-annuelle, citepa)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    'Une formule dont les dépendances ont la même périodicité est acceptée'
);

SELECT results_eq(
    $$
        SELECT dependance.source_identifiant
        FROM private.indicateur_definition_dependance_calcul dependance
        JOIN test_indicateur_periodicite_formule definition
          ON definition.id = dependance.indicateur_id
        WHERE definition.identifiant_referentiel = 'test-formule-cible'
    $$,
    $$ VALUES ('test-formule-source-annuelle'::text) $$,
    'La projection contient exactement la dépendance dédupliquée'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule = 'val(test-formule-source-mensuelle)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    23514,
    NULL,
    'Une écriture SQL directe ne peut pas créer une formule de périodicité hétérogène'
);

SELECT results_eq(
    $$
        SELECT dependance.source_identifiant
        FROM private.indicateur_definition_dependance_calcul dependance
        JOIN test_indicateur_periodicite_formule definition
          ON definition.id = dependance.indicateur_id
        WHERE definition.identifiant_referentiel = 'test-formule-cible'
    $$,
    $$ VALUES ('test-formule-source-annuelle'::text) $$,
    'Le rejet restaure aussi atomiquement la projection précédente'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule = 'val(test-formule-source-inconnue)'
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    23503,
    NULL,
    'Une formule ne peut pas référencer une définition absente'
);

SELECT throws_ok(
    $$
        UPDATE public.indicateur_definition
        SET periodicite = 'mensuelle'
        WHERE identifiant_referentiel = 'test-formule-source-annuelle'
    $$,
    23514,
    NULL,
    'Changer la source ne peut pas rendre une formule existante hétérogène'
);

SELECT throws_ok(
    $$
        DELETE FROM public.indicateur_definition
        WHERE identifiant_referentiel = 'test-formule-source-annuelle'
    $$,
    23503,
    NULL,
    'Supprimer une source encore référencée est refusé'
);

SELECT lives_ok(
    $$
        UPDATE public.indicateur_definition
        SET periodicite = 'mensuelle'
        WHERE identifiant_referentiel IN (
            'test-formule-source-annuelle',
            'test-formule-cible'
        )
    $$,
    'Une instruction multi-lignes peut déplacer atomiquement un graphe homogène'
);

UPDATE public.indicateur_definition
SET periodicite = 'annuelle'
WHERE identifiant_referentiel IN (
    'test-formule-source-annuelle',
    'test-formule-cible'
);

SELECT lives_ok(
    $$
        SET CONSTRAINTS verifier_periodicite_dependances_formule DEFERRED;
        UPDATE public.indicateur_definition
        SET periodicite = 'mensuelle'
        WHERE identifiant_referentiel = 'test-formule-source-annuelle';
        UPDATE public.indicateur_definition
        SET periodicite = 'mensuelle'
        WHERE identifiant_referentiel = 'test-formule-cible';
        SET CONSTRAINTS verifier_periodicite_dependances_formule IMMEDIATE
    $$,
    'Une migration peut différer le contrôle pour remplacer le graphe en plusieurs instructions'
);

SELECT lives_ok(
    $$
        UPDATE public.indicateur_definition
        SET valeur_calcule = NULL
        WHERE identifiant_referentiel = 'test-formule-cible'
    $$,
    'Retirer une formule retire aussi son invariant de dépendance'
);

SELECT is_empty(
    $$
        SELECT 1
        FROM private.indicateur_definition_dependance_calcul dependance
        JOIN test_indicateur_periodicite_formule definition
          ON definition.id = dependance.indicateur_id
        WHERE definition.identifiant_referentiel = 'test-formule-cible'
    $$,
    'Retirer une formule vide sa projection dérivée'
);

ROLLBACK;

-- Verify tet:indicateur/dependances_formules on pg

BEGIN;

DO $$
BEGIN
    ASSERT to_regprocedure(
        'private.extraire_dependances_formule_indicateur(text)'
    ) IS NOT NULL,
        'La fonction canonique d extraction des dépendances doit exister';

    ASSERT (
        SELECT proisstrict
               AND provolatile = 'i'
               AND proparallel = 's'
        FROM pg_proc
        WHERE oid =
            'private.extraire_dependances_formule_indicateur(text)'::regprocedure
    ), 'L extraction doit être immutable, stricte et parallèle-safe';

    ASSERT (
        SELECT count(*) = 2
               AND bool_and(
                   source_identifiant IN ('source-a', 'source_b')
               )
        FROM private.extraire_dependances_formule_indicateur(
            'val(Source-A) + cible(source_b) + val(source-a)'
        )
    ), 'L extraction doit normaliser et dédupliquer les dépendances';

    ASSERT NOT has_function_privilege(
        'anon',
        'private.extraire_dependances_formule_indicateur(text)',
        'EXECUTE'
    ) AND NOT has_function_privilege(
        'authenticated',
        'private.extraire_dependances_formule_indicateur(text)',
        'EXECUTE'
    ) AND NOT has_function_privilege(
        'service_role',
        'private.extraire_dependances_formule_indicateur(text)',
        'EXECUTE'
    ), 'L extraction interne ne doit pas être exposée aux rôles API';
END $$;

ROLLBACK;

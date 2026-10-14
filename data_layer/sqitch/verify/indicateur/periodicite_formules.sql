-- Verify tet:indicateur/periodicite_formules on pg

BEGIN;

DO $$
BEGIN
    ASSERT to_regprocedure(
        'private.extraire_dependances_formule_indicateur(text)'
    ) IS NOT NULL,
        'La fonction canonique d extraction des dépendances doit exister';

    ASSERT to_regprocedure(
        'private.verifier_periodicite_dependances_formule(integer,text[])'
    ) IS NOT NULL,
        'La validation des dépendances doit exister';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'verifier_periodicite_dependances_formule'
          AND tgrelid = 'public.indicateur_definition'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
          AND tgtype::integer = 29
          AND tgconstraint <> 0
          AND tgdeferrable
          AND NOT tginitdeferred
          AND tgfoid =
              'private.verifier_periodicite_dependances_formule_trigger()'::regprocedure
          AND (
              SELECT array_agg(attribute.attname ORDER BY attribute.attname)
              FROM unnest(tgattr::smallint[]) AS updated(attnum)
              JOIN pg_attribute attribute
                ON attribute.attrelid = pg_trigger.tgrelid
               AND attribute.attnum = updated.attnum
          ) = ARRAY[
              'id',
              'identifiant_referentiel',
              'periodicite',
              'valeur_calcule'
          ]::name[]
    ), 'La contrainte de graphe doit être différable et couvrir toute mutation pertinente';

    PERFORM private.verifier_periodicite_dependances_formule();

    ASSERT NOT has_function_privilege(
        'anon',
        'private.verifier_periodicite_dependances_formule(integer,text[])',
        'EXECUTE'
    ) AND NOT has_function_privilege(
        'authenticated',
        'private.verifier_periodicite_dependances_formule(integer,text[])',
        'EXECUTE'
    ) AND NOT has_function_privilege(
        'service_role',
        'private.verifier_periodicite_dependances_formule(integer,text[])',
        'EXECUTE'
    ), 'La validation interne ne doit pas être exposée aux rôles API';
END $$;

ROLLBACK;

-- Verify tet:indicateur/periodicite_formules on pg

BEGIN;

DO $$
BEGIN
    ASSERT to_regclass(
        'private.indicateur_definition_dependance_calcul'
    ) IS NOT NULL,
        'La projection des dépendances de formule doit exister';

    ASSERT to_regprocedure(
        'private.extraire_dependances_formule_indicateur(text)'
    ) IS NOT NULL,
        'La fonction canonique d extraction des dépendances doit exister';

    ASSERT to_regprocedure(
        'private.verifier_periodicite_dependances_formule(integer,text[])'
    ) IS NOT NULL,
        'La validation des dépendances doit exister';

    ASSERT to_regclass(
        'private.indicateur_definition_dependance_calcul_source_idx'
    ) IS NOT NULL,
        'Les validations entrantes doivent utiliser un index par source';

    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'synchroniser_dependances_formule_indicateur'
          AND tgrelid = 'public.indicateur_definition'::regclass
          AND tgenabled = 'O'
          AND NOT tgisinternal
          AND tgtype::integer = 21
          AND tgfoid =
              'private.synchroniser_dependances_formule_indicateur()'::regprocedure
    ), 'La projection doit être synchronisée AFTER ROW à chaque formule écrite';

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

    ASSERT NOT EXISTS (
        SELECT 1
        FROM private.indicateur_definition_dependance_calcul dependance
        JOIN public.indicateur_definition cible
          ON cible.id = dependance.indicateur_id
        LEFT JOIN public.indicateur_definition source
          ON source.identifiant_referentiel = dependance.source_identifiant
        WHERE source.id IS NULL
           OR source.periodicite IS DISTINCT FROM cible.periodicite
    ), 'Toutes les dépendances projetées doivent exister et être homogènes';

    ASSERT NOT has_table_privilege(
        'anon',
        'private.indicateur_definition_dependance_calcul',
        'SELECT,INSERT,UPDATE,DELETE'
    ) AND NOT has_table_privilege(
        'authenticated',
        'private.indicateur_definition_dependance_calcul',
        'SELECT,INSERT,UPDATE,DELETE'
    ) AND NOT has_table_privilege(
        'service_role',
        'private.indicateur_definition_dependance_calcul',
        'SELECT,INSERT,UPDATE,DELETE'
    ), 'La projection dérivée ne doit pas être modifiable par les rôles API';
END $$;

ROLLBACK;

-- Verify tet:indicateur/import_emt_valeur on pg

BEGIN;

DO $$
BEGIN
    ASSERT to_regprocedure(
        'public.import_indicateur_emt_valeurs(integer,jsonb)'
    ) IS NOT NULL,
        'La RPC transactionnelle par lot de l''import EMT doit exister';

    ASSERT has_function_privilege(
        'service_role',
        'public.import_indicateur_emt_valeurs(integer,jsonb)',
        'EXECUTE'
    ), 'Le rôle de service doit pouvoir appeler la RPC EMT';

    ASSERT NOT has_function_privilege(
        'anon',
        'public.import_indicateur_emt_valeurs(integer,jsonb)',
        'EXECUTE'
    ) AND NOT has_function_privilege(
        'authenticated',
        'public.import_indicateur_emt_valeurs(integer,jsonb)',
        'EXECUTE'
    ), 'La RPC EMT ne doit pas être exposée aux rôles utilisateurs';

    ASSERT position(
        'pg_advisory_xact_lock_shared' IN pg_get_functiondef(
            'public.import_indicateur_emt_valeurs(integer,jsonb)'::regprocedure
        )
    ) > 0, 'La RPC EMT doit participer au verrou du graphe';

    ASSERT position(
        'jsonb_array_elements' IN pg_get_functiondef(
            'public.import_indicateur_emt_valeurs(integer,jsonb)'::regprocedure
        )
    ) > 0, 'La RPC EMT doit traiter tout le classeur dans un appel par lot';

    ASSERT position(
        'to_char(valeur_a_ecrire.date_debut, ''YYYY-MM-DD'')'
        IN pg_get_functiondef(
            'public.import_indicateur_emt_valeurs(integer,jsonb)'::regprocedure
        )
    ) = 0, 'La RPC ne doit plus prendre ses verrous au fil des écritures';

    ASSERT position(
        'ORDER BY lock_key'
        IN pg_get_functiondef(
            'public.import_indicateur_emt_valeurs(integer,jsonb)'::regprocedure
        )
    ) > 0, 'Les clés de verrou EMT doivent suivre un ordre global stable';

    ASSERT position(
        'to_char(valeur.date_debut, ''YYYY-MM-DD'')'
        IN pg_get_functiondef(
            'public.import_indicateur_emt_valeurs(integer,jsonb)'::regprocedure
        )
    ) > 0, 'La clé de verrou EMT doit être indépendante de DateStyle';
END;
$$;

ROLLBACK;

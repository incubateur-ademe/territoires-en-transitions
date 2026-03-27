-- Verify tet:referentiel/drop_action_information_rpcs on pg

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'action_contexte',
              'action_exemples',
              'action_ressources',
              'action_perimetre_evaluation'
          )
    ) THEN
        RAISE EXCEPTION 'action information RPCs still exist';
    END IF;
END $$;

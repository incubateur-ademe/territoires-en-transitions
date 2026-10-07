-- Verify tet:evaluation/drop_business_evaluation on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name = 'after_action_statut_insert'
        AND event_object_table = 'action_statut'
    ) THEN
          RAISE EXCEPTION 'Le trigger after_action_statut_insert existe encore sur action_statut';
    END IF;

    IF to_regprocedure('public.after_action_statut_call_business()') IS NOT NULL THEN
          RAISE EXCEPTION 'La fonction after_action_statut_call_business existe encore';
    END IF;

    IF to_regnamespace('evaluation') IS NOT NULL THEN
          RAISE EXCEPTION 'Le schéma evaluation existe encore';
    END IF;
END $$;

ROLLBACK;

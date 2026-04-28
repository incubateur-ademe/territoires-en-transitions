-- Verify tet:evaluation/drop-question-thematique-completude on pg

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname IN ('question_thematique_completude', 'question_thematique_display', 'question_display', 'reponse_display')
  ) THEN
    RAISE EXCEPTION 'One of the dropped public views still exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('after_reponse_call_business', 'after_reponse_insert_write_event')
  ) THEN
    RAISE EXCEPTION 'One of the dropped public functions still exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private'
      AND p.proname IN ('reponse_count_by_thematique', 'question_count_for_thematique')
  ) THEN
    RAISE EXCEPTION 'One of the dropped private functions still exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND t.tgname = 'after_reponse_insert'
      AND c.relname IN ('reponse_binaire', 'reponse_choix', 'reponse_proportion')
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'One of the dropped after_reponse_insert triggers still exists';
  END IF;
END $$;

ROLLBACK;

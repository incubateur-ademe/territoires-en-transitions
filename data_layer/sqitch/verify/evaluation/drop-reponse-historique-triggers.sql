-- Verify tet:evaluation/drop-reponse-historique-triggers on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'save_history'
          AND c.relname IN ('reponse_binaire', 'reponse_choix', 'reponse_proportion', 'justification')
    ) THEN
        RAISE EXCEPTION 'Un trigger save_history existe encore sur les tables de réponse/justification';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname IN (
            'set_modified_at_before_reponse_binaire_update',
            'set_modified_at_before_reponse_choix_update',
            'set_modified_at_before_reponse_proportion_update'
        )
          AND c.relname IN ('reponse_binaire', 'reponse_choix', 'reponse_proportion')
    ) THEN
        RAISE EXCEPTION 'Un trigger set_modified_at_before_reponse_*_update existe encore';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'historique'
          AND p.proname IN (
            'save_reponse_binaire',
            'save_reponse_choix',
            'save_reponse_proportion',
            'save_justification'
          )
    ) THEN
        RAISE EXCEPTION 'Une fonction historique.save_reponse_* ou save_justification existe encore';
    END IF;
END $$;

ROLLBACK;

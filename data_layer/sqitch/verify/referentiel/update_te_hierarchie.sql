-- Verify tet:referentiel/update_te_hierarchie on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM referentiel_definition
        WHERE id IN ('te', 'te-test')
          AND hierarchie <> '{"referentiel", "axe", "sous-axe", "action", "sous-action", "tache"}'::action_type[]
    ) THEN
        RAISE EXCEPTION 'hierarchie pour te / te-test non mise à jour';
    END IF;
END $$;

ROLLBACK;

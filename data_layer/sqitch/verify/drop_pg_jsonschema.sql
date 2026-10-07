-- Verify tet:drop_pg_jsonschema on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS(SELECT FROM pg_extension WHERE extname = 'pg_jsonschema')
    THEN
        RAISE EXCEPTION 'L''extension pg_jsonschema est encore installée';
    END IF;

    IF EXISTS(SELECT FROM pg_constraint
              WHERE conrelid = 'action_impact'::regclass
                AND conname IN ('action_impact_subventions_mobilisables_check',
                                'action_impact_ressources_externes_check',
                                'action_impact_rex_check'))
    THEN
        RAISE EXCEPTION 'Une contrainte jsonschema existe encore sur action_impact';
    END IF;
END $$;

ROLLBACK;

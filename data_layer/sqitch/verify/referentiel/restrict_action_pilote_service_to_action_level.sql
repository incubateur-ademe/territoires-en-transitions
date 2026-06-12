-- Verify tet:referentiel/restrict_action_pilote_service_to_action_level on pg

BEGIN;

DO
$$
    DECLARE
        invalid_pilotes integer;
        invalid_services integer;
    BEGIN
        SELECT count(*)
        INTO invalid_pilotes
        FROM action_pilote ap
        WHERE NOT private.action_id_is_action_level(ap.action_id);

        IF invalid_pilotes > 0 THEN
            RAISE EXCEPTION '% ligne(s) action_pilote hors niveau "action"', invalid_pilotes;
        END IF;

        SELECT count(*)
        INTO invalid_services
        FROM action_service aserv
        WHERE NOT private.action_id_is_action_level(aserv.action_id);

        IF invalid_services > 0 THEN
            RAISE EXCEPTION '% ligne(s) action_service hors niveau "action"', invalid_services;
        END IF;
    END;
$$;

SELECT 1
FROM pg_trigger
WHERE tgname = 'check_action_level'
  AND tgrelid = 'action_pilote'::regclass;

SELECT 1
FROM pg_trigger
WHERE tgname = 'check_action_level'
  AND tgrelid = 'action_service'::regclass;

ROLLBACK;

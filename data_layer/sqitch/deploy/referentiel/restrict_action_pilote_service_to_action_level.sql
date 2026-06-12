-- Deploy tet:referentiel/restrict_action_pilote_service_to_action_level to pg
-- requires: referentiel/action_pilote
-- requires: referentiel/action_service
-- requires: referentiel/referentiel@v4.50.0
-- requires: referentiel/vue_tabulaire@v2.11.0

BEGIN;

-- Type d'action dérivé de la profondeur dans private.action_hierarchy
-- et de la hiérarchie du référentiel (referentiel_definition.hierarchie).
CREATE OR REPLACE FUNCTION private.action_id_is_action_level(p_action_id action_id)
    RETURNS boolean
    LANGUAGE sql
    STABLE
AS
$$
SELECT EXISTS (SELECT 1
               FROM private.action_hierarchy ah
                        JOIN referentiel_definition rd ON rd.id = ah.referentiel::text
               WHERE ah.action_id = p_action_id
                 AND rd.hierarchie[ah.depth + 1] = 'action'::action_type);
$$;

COMMENT ON FUNCTION private.action_id_is_action_level(action_id) IS
    'Vrai si l''action_id correspond au niveau "action" (mesure) du référentiel, selon action_hierarchy et referentiel_definition.hierarchie.';

DELETE
FROM action_pilote ap
WHERE NOT private.action_id_is_action_level(ap.action_id);

DELETE
FROM action_service aserv
WHERE NOT private.action_id_is_action_level(aserv.action_id);

CREATE OR REPLACE FUNCTION private.check_action_pilote_service_action_level()
    RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF NOT private.action_id_is_action_level(NEW.action_id) THEN
        RAISE EXCEPTION
            'action_id % doit référencer une action de type "action" (mesure), pas un autre niveau de la hiérarchie',
            NEW.action_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_action_level ON action_pilote;
CREATE TRIGGER check_action_level
    BEFORE INSERT OR UPDATE OF action_id
    ON action_pilote
    FOR EACH ROW
EXECUTE FUNCTION private.check_action_pilote_service_action_level();

DROP TRIGGER IF EXISTS check_action_level ON action_service;
CREATE TRIGGER check_action_level
    BEFORE INSERT OR UPDATE OF action_id
    ON action_service
    FOR EACH ROW
EXECUTE FUNCTION private.check_action_pilote_service_action_level();

COMMIT;

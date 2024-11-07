-- Deploy tet:plan_action/fiches to pg

BEGIN;

--
-- Revert 1. TAGS DE SUIVI LIBRES

DROP TABLE fiche_action_libre_tag;
DROP TABLE libre_tag;

--
-- Revert 2. INSTANCES DE GOUVERNANCE
ALTER TABLE fiche_action DROP COLUMN instance_gouvernance;

--
-- Revert 3. PARTICIPATION CITOYENNE
ALTER TABLE fiche_action DROP COLUMN participation_citoyenne;
ALTER TABLE fiche_action DROP COLUMN participation_citoyenne_type;

COMMIT;


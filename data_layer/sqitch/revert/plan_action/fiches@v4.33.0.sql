-- Deploy tet:plan_action/fiches to pg

BEGIN;

ALTER TABLE public.fiche_action_pilote
DROP CONSTRAINT IF EXISTS either_user_or_tag_not_null;

COMMIT;

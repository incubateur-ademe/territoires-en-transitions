-- Deploy tet:plan_action/fiches to pg

BEGIN;

ALTER TABLE public.fiche_action_pilote
ADD CONSTRAINT either_user_or_tag_not_null
CHECK (user_id IS NOT NULL OR tag_id IS NOT NULL);

COMMIT;

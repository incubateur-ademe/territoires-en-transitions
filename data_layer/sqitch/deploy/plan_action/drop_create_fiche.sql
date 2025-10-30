-- Deploy tet:plan_action/drop_create_fiche to pg

BEGIN;

drop function public.create_fiche;

COMMIT;

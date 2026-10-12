-- Revert tet:shared/action_de_reference_fiche from pg

BEGIN;

DROP TABLE public.action_de_reference_fiche;

COMMIT;

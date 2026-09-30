-- Revert tet:shared/action_de_reference from pg

BEGIN;

DROP TABLE public.action_de_reference;

COMMIT;

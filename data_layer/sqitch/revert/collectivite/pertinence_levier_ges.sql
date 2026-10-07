-- Revert tet:collectivite/pertinence_levier_ges from pg

BEGIN;

DROP TABLE public.collectivite_levier_ges_pertinence;

DROP TYPE public.levier_pertinence;

COMMIT;

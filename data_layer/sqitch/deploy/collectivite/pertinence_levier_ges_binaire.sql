-- Deploy tet:collectivite/pertinence_levier_ges_binaire to pg
-- requires: collectivite/pertinence_levier_ges

BEGIN;

DELETE FROM public.collectivite_levier_ges_pertinence
WHERE pertinence = 'a_discuter';

ALTER TYPE public.levier_pertinence RENAME TO levier_pertinence_old;

CREATE TYPE public.levier_pertinence AS ENUM ('non_pertinent', 'pertinent');

ALTER TABLE public.collectivite_levier_ges_pertinence
    ALTER COLUMN pertinence TYPE public.levier_pertinence
        USING pertinence::text::public.levier_pertinence;

DROP TYPE public.levier_pertinence_old;

COMMIT;

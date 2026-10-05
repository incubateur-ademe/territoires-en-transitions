-- Revert tet:collectivite/pertinence_levier_ges_binaire from pg

BEGIN;

ALTER TYPE public.levier_pertinence RENAME TO levier_pertinence_binaire;

CREATE TYPE public.levier_pertinence AS ENUM ('non_pertinent', 'a_discuter', 'pertinent');

ALTER TABLE public.collectivite_levier_ges_pertinence
    ALTER COLUMN pertinence TYPE public.levier_pertinence
        USING pertinence::text::public.levier_pertinence;

DROP TYPE public.levier_pertinence_binaire;

COMMIT;

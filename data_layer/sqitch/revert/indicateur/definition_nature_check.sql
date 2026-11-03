BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.indicateur_definition
    DROP CONSTRAINT indicateur_definition_nature_check;

COMMIT;

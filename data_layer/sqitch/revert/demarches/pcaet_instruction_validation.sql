-- Revert tet:demarches/pcaet_instruction_validation from pg

BEGIN;

DROP TABLE IF EXISTS public.pcaet_instruction_validation;

COMMIT;

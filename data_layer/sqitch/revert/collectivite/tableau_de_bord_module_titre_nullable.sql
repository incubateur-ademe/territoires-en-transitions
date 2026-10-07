-- Revert tet:collectivite/tableau_de_bord_module_titre_nullable from pg

BEGIN;

UPDATE public.tableau_de_bord_module
SET titre = ''
WHERE titre IS NULL;

ALTER TABLE public.tableau_de_bord_module
    ALTER COLUMN titre SET NOT NULL;

COMMIT;

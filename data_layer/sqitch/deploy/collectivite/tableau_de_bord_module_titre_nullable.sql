-- Deploy tet:collectivite/tableau_de_bord_module_titre_nullable to pg
-- requires: collectivite/tableau_de_bord

-- Le titre n'est personnalisable que pour les modules collectivite.
-- Les modules personnels (user_id non null) n'en ont pas : leur titre
-- vient toujours de la config applicative par défaut.

BEGIN;

ALTER TABLE public.tableau_de_bord_module
    ALTER COLUMN titre DROP NOT NULL;

UPDATE public.tableau_de_bord_module
SET titre = NULL
WHERE user_id IS NOT NULL;

COMMIT;

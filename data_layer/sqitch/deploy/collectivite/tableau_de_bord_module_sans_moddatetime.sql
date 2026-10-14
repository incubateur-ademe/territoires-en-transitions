-- Deploy tet:collectivite/tableau_de_bord_module_sans_moddatetime to pg
-- requires: collectivite/tableau_de_bord_module_titre_nullable

BEGIN;

-- Remplace moddatetime par la fonction standard du projet, puis retire l'extension
-- dont c'était le seul usage.
DROP TRIGGER IF EXISTS on_tableau_de_bord_module_modified ON public.tableau_de_bord_module;

CREATE TRIGGER on_tableau_de_bord_module_modified
    BEFORE UPDATE ON public.tableau_de_bord_module
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_at();

DROP EXTENSION IF EXISTS moddatetime;

COMMIT;

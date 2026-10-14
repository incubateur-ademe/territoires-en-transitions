-- Revert tet:collectivite/tableau_de_bord_module_sans_moddatetime from pg

BEGIN;

CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

DROP TRIGGER IF EXISTS on_tableau_de_bord_module_modified ON public.tableau_de_bord_module;

CREATE TRIGGER on_tableau_de_bord_module_modified
    BEFORE UPDATE ON public.tableau_de_bord_module
    FOR EACH ROW
    EXECUTE PROCEDURE extensions.moddatetime(modified_at);

COMMIT;

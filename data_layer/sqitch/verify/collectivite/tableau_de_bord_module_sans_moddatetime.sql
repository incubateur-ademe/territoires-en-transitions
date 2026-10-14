-- Verify tet:collectivite/tableau_de_bord_module_sans_moddatetime on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 1
        FROM pg_trigger t
        WHERE t.tgrelid = 'public.tableau_de_bord_module'::regclass
          AND t.tgname = 'on_tableau_de_bord_module_modified'
          AND t.tgfoid = 'public.update_modified_at()'::regprocedure
    ), 'tableau_de_bord_module doit mettre à jour modified_at via update_modified_at()';

    ASSERT (
        SELECT COUNT(*) = 0 FROM pg_extension WHERE extname = 'moddatetime'
    ), 'L''extension moddatetime ne doit plus être installée';
END $$;

ROLLBACK;

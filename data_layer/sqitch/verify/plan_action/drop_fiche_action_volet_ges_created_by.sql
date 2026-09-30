-- Verify tet:plan_action/drop_fiche_action_volet_ges_created_by on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'fiche_action_volet_ges'
              AND column_name = 'created_by'
        ), 'La colonne created_by de fiche_action_volet_ges doit etre supprimee : les volets n ont plus d auteur';
    END
$$;

ROLLBACK;

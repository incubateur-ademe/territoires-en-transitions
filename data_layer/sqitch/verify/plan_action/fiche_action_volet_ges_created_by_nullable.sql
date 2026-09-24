-- Verify tet:plan_action/fiche_action_volet_ges_created_by_nullable on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT (
            SELECT is_nullable = 'YES'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'fiche_action_volet_ges'
              AND column_name = 'created_by'
        ), 'La colonne created_by de fiche_action_volet_ges doit accepter null : les volets s ecrivent sans auteur';
    END
$$;

ROLLBACK;

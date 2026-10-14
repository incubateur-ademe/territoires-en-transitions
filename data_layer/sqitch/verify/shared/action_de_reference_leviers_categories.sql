-- Verify tet:shared/action_de_reference_leviers_categories on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT (
            SELECT count(*) = 2
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'action_de_reference'
              AND ((column_name = 'leviers' AND udt_name = '_levier_ges_id' AND is_nullable = 'NO')
                   OR (column_name = 'categories' AND udt_name = '_volet_categorie' AND is_nullable = 'NO'))
        ), 'Les colonnes leviers (levier_ges_id[]) et categories (volet_categorie[]) doivent exister, NOT NULL';
    END
$$;

ROLLBACK;

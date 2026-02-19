-- Verify tet:migration/etape_to_sous_action on pg

SELECT etape_id, sous_action_id, created_at
FROM migration.etape_to_sous_action
WHERE false;

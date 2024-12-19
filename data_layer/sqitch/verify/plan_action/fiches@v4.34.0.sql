-- Verify tet:plan_action/fiches on pg

BEGIN;

SELECT tc.constraint_name,
       rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'fiche_action_note'
    AND tc.constraint_name = 'fiche_action_note_fiche_id_fkey'
    AND rc.delete_rule = 'CASCADE';

ROLLBACK;

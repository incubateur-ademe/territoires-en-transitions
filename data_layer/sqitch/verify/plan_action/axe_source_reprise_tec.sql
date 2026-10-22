-- Verify tet:plan_action/axe_source_reprise_tec on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%reprise_tec%'
        FROM pg_constraint
        WHERE conname = 'axe_source_check'
    ), 'La contrainte axe_source_check doit accepter reprise_tec';
END $$;

ROLLBACK;

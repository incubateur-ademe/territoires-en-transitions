-- Revert tet:indicateur/reconciliation_formules from pg

BEGIN;

-- Même ordre que les producteurs et consommateurs : le verrou du graphe
-- interdit qu'une nouvelle intention soit validée entre le préflight et le
-- DROP, puis ACCESS EXCLUSIVE attend la fin d'un éventuel claim en cours.
SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE private.indicateur_reconciliation_formule
    IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM private.indicateur_reconciliation_formule
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Impossible de retirer la file de réconciliation tant que des formules restent à recalculer';
    END IF;
END $$;

DROP TABLE private.indicateur_reconciliation_formule;

COMMIT;

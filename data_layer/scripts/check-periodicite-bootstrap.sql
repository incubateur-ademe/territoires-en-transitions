\set ON_ERROR_STOP on

-- Autorise l'acquittement automatique uniquement avant la toute première
-- migration ou après un contract déjà enregistré. Une base persistante
-- arrêtée à l'expand doit passer par le workflow de rollout protégé.
DO $bootstrap_guard$
DECLARE
    contract_applied boolean;
    deployed_changes bigint;
    application_schema_present boolean :=
        to_regclass('public.collectivite') IS NOT NULL
        OR to_regclass('public.indicateur_definition') IS NOT NULL;
BEGIN
    IF to_regclass('sqitch.changes') IS NULL THEN
        IF NOT application_schema_present THEN
            RETURN;
        END IF;

        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'Acquittement automatique refusé : schéma applicatif présent sans registre Sqitch';
    END IF;

    EXECUTE $query$
        SELECT EXISTS (
            SELECT 1
            FROM sqitch.changes
            WHERE project = 'tet'
              AND change = 'indicateur/periodicite_obligatoire'
        )
    $query$ INTO contract_applied;

    IF contract_applied THEN
        RETURN;
    END IF;

    EXECUTE $query$
        SELECT count(*)
        FROM sqitch.changes
        WHERE project = 'tet'
    $query$ INTO deployed_changes;

    IF deployed_changes = 0 AND NOT application_schema_present THEN
        RETURN;
    END IF;

    RAISE EXCEPTION USING
        ERRCODE = '55000',
        MESSAGE = 'Acquittement automatique refusé sur une base existante arrêtée avant le contract de périodicité';
END
$bootstrap_guard$;

-- Verify tet:indicateur/reconciliation_formules on pg

BEGIN;

DO $$
DECLARE
    claim_index_definition text;
    target_index_definition text;
BEGIN
    ASSERT to_regclass('private.indicateur_reconciliation_formule') IS NOT NULL,
        'La file durable de réconciliation des formules doit exister';

    ASSERT (
        SELECT COUNT(*) = 10
        FROM information_schema.columns
        WHERE table_schema = 'private'
          AND table_name = 'indicateur_reconciliation_formule'
          AND column_name IN (
              'id', 'generation', 'indicateur_id', 'collectivite_id',
              'formule_attendue', 'created_at', 'next_attempt_at', 'failure_count',
              'last_failed_at', 'last_error'
          )
    ), 'La file doit exposer exactement les dix colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 3
        FROM information_schema.columns
        WHERE table_schema = 'private'
          AND table_name = 'indicateur_reconciliation_formule'
          AND column_name IN ('formule_attendue', 'last_failed_at', 'last_error')
          AND is_nullable = 'YES'
    ), 'Seules les informations de formule retirée et de dernier échec sont optionnelles';

    ASSERT (
        SELECT COUNT(*) = 7
        FROM information_schema.columns
        WHERE table_schema = 'private'
          AND table_name = 'indicateur_reconciliation_formule'
          AND column_name IN (
              'id', 'generation', 'indicateur_id', 'collectivite_id',
              'created_at', 'next_attempt_at', 'failure_count'
          )
          AND is_nullable = 'NO'
    ), 'Toutes les autres colonnes de la file doivent être NOT NULL';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM information_schema.table_constraints
        WHERE table_schema = 'private'
          AND table_name = 'indicateur_reconciliation_formule'
          AND constraint_type = 'FOREIGN KEY'
    ), 'La cible et la collectivité doivent être protégées par des clés étrangères';

    SELECT pg_get_indexdef(indexrelid)
    INTO claim_index_definition
    FROM pg_index
    WHERE indexrelid =
        'private.indicateur_reconciliation_formule_claim_idx'::regclass;

    ASSERT claim_index_definition LIKE '%next_attempt_at%failure_count%created_at%indicateur_id%collectivite_id%id%',
        'L''index de revendication doit porter l''ordre stable de traitement';

    SELECT pg_get_indexdef(indexrelid)
    INTO target_index_definition
    FROM pg_index
    WHERE indexrelid =
        'private.indicateur_reconciliation_formule_target_idx'::regclass;

    ASSERT target_index_definition LIKE '%indicateur_id%next_attempt_at%created_at%collectivite_id%id%',
        'Le drain prioritaire d''un import doit disposer de son index par cible';

    ASSERT NOT has_table_privilege(
        'anon',
        'private.indicateur_reconciliation_formule',
        'SELECT'
    ) AND NOT has_table_privilege(
        'authenticated',
        'private.indicateur_reconciliation_formule',
        'SELECT'
    ) AND NOT has_table_privilege(
        'service_role',
        'private.indicateur_reconciliation_formule',
        'SELECT'
    ), 'La file interne ne doit être lisible par aucun rôle API';
END $$;

ROLLBACK;

-- Verify tet:demarche/pcaet_depot_hors_plateforme on pg

BEGIN;

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'demarche'
          AND column_name = 'transmitted_off_platform'
          AND data_type = 'boolean' AND is_nullable = 'NO'
    ), 'La colonne transmitted_off_platform (boolean NOT NULL) doit exister sur public.demarche';

    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%instruit_hors_plateforme%'
        FROM pg_constraint WHERE conname = 'demarche_status_check'
    ), 'demarche_status_check doit accepter instruit_hors_plateforme';

    -- L'index et le trigger portent la même liste de statuts « en cours » : un
    -- oubli de l'un des deux laisse passer un second dépôt, ou un plan capté.
    ASSERT (
        SELECT pg_get_indexdef(indexrelid) LIKE '%instruit_hors_plateforme%'
        FROM pg_index WHERE indexrelid = 'public.demarche_active_unique'::regclass
    ), 'demarche_active_unique doit couvrir instruit_hors_plateforme';

    ASSERT (
        SELECT prosrc LIKE '%instruit_hors_plateforme%'
        FROM pg_proc WHERE proname = 'demarche_plan_action_exclusif'
    ), 'demarche_plan_action_exclusif doit couvrir instruit_hors_plateforme';
END $$;

ROLLBACK;

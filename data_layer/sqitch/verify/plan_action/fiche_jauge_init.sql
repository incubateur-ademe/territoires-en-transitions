-- Verify tet:plan_action/fiche_jauge_init on pg

BEGIN;

DO $$
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1
        FROM public.fiche_action
        WHERE parent_id IS NULL
          AND statut = 'Réalisé'
          AND jauge <> 100
    ), 'Les fiches Réalisé doivent être à 100 %';
    ASSERT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgrelid = 'public.fiche_action'::regclass
          AND tgname = 'save_history'
          AND tgenabled = 'O'
    ), 'Le trigger save_history doit être réactivé';
END $$;

ROLLBACK;

-- Revert tet:indicateur/periodicite-nettoyage from pg
DO $$
BEGIN
    RAISE EXCEPTION USING ERRCODE = '0A000',
        MESSAGE = 'Le nettoyage des périodicités est définitif : l archive de réparation a été supprimée, revert indisponible';
END $$;

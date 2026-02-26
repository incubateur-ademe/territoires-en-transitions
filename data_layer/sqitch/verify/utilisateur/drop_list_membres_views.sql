-- Verify tet:utilisateur/drop_list_membres_views on pg

BEGIN;

-- Verify deprecated member functions have been removed
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
                  WHERE n.nspname = 'public' AND p.proname = 'collectivite_membres')
  AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
                  WHERE n.nspname = 'public' AND p.proname = 'update_collectivite_membre_niveau_acces')
  AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
                  WHERE n.nspname = 'public' AND p.proname = 'update_collectivite_membre_details_fonction')
  AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
                  WHERE n.nspname = 'public' AND p.proname = 'update_collectivite_membre_fonction')
  AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
                  WHERE n.nspname = 'public' AND p.proname = 'update_collectivite_membre_champ_intervention')
  AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
                  WHERE n.nspname = 'public' AND p.proname = 'remove_membre_from_collectivite');

ROLLBACK;

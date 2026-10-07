-- Verify tet:collectivite/tableau_de_bord_module_titre_nullable on pg

BEGIN;

SELECT 1 / (count(*) = 1)::int
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tableau_de_bord_module'
  AND column_name = 'titre'
  AND is_nullable = 'YES';

ROLLBACK;

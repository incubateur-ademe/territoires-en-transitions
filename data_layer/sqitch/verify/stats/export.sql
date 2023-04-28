-- Verify tet:retool/utilisateur on pg

BEGIN;

select has_function_privilege('stats.export_utilisateurs_en_colonne_csv_text()', 'execute');

ROLLBACK;

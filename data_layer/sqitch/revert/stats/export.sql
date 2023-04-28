-- Deploy tet:retool/utilisateur to pg

BEGIN;

drop function stats.export_utilisateurs_en_colonne_csv_text;

COMMIT;

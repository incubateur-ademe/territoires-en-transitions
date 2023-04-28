-- Revert tet:stats/reporting from pg

BEGIN;

drop function stats.refresh_reporting;
drop materialized view stats.report_indicateur_resultat;
drop materialized view stats.report_reponse_proportion;
drop materialized view stats.report_reponse_binaire;
drop materialized view stats.report_reponse_choix;
drop view stats.report_choix;
drop view stats.report_question;
drop materialized view stats.report_scores;

COMMIT;

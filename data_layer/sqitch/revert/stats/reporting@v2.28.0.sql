-- Deploy tet:stats/reporting to pg

BEGIN;

create or replace function
    stats.refresh_reporting()
    returns void
as
$$
begin
    refresh materialized view stats.report_scores;
    refresh materialized view stats.report_reponse_choix;
    refresh materialized view stats.report_reponse_binaire;
    refresh materialized view stats.report_reponse_proportion;
    refresh materialized view stats.report_indicateur_resultat;
end;
$$ language plpgsql;

drop materialized view stats.report_indicateur_personnalise;
drop materialized view stats.report_indicateur;

COMMIT;

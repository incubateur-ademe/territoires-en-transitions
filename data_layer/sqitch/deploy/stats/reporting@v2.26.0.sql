-- Deploy tet:stats/reporting to pg

BEGIN;

create materialized view stats.report_scores
as
select c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       ts.referentiel,
       ts.action_id,
       ts.score_realise,
       ts.score_programme,
       ts.score_realise_plus_programme,
       ts.score_pas_fait,
       ts.score_non_renseigne,
       ts.points_restants,
       ts.points_realises,
       ts.points_programmes,
       ts.points_max_personnalises,
       ts.points_max_referentiel,
       ts.avancement,
       ts.concerne,
       ts.desactive
from stats.collectivite c
         join client_scores cs using (collectivite_id)
    -- que l'on explose en lignes, une par action
         join private.convert_client_scores(cs.scores) ccc on true
    -- puis on converti chacune de ces lignes au format approprié pour les vues tabulaires du client
         join private.to_tabular_score(ccc) ts on true
order by c.collectivite_id;

create view stats.report_question
as
select id,
       thematique_id,
       type,
       description,
       formulation
from question q;

create view stats.report_choix
as
select question_id,
       id,
       formulation
from question_choix qc;

create materialized view stats.report_reponse_choix
as
select collectivite_id,
       code_siren_insee,
       nom,
       question_id,
       reponse
from stats.collectivite c
         join public.reponse_choix rc using (collectivite_id);

create materialized view stats.report_reponse_binaire
as
select collectivite_id,
       code_siren_insee,
       nom,
       question_id,
       reponse
from stats.collectivite c
         join public.reponse_binaire rb using (collectivite_id);

create materialized view stats.report_reponse_proportion
as
select collectivite_id,
       code_siren_insee,
       nom,
       question_id,
       reponse
from stats.collectivite c
         join public.reponse_proportion rp using (collectivite_id);

create materialized view stats.report_indicateur_resultat
as
select collectivite_id,
       code_siren_insee,
       nom,
       indicateur_id,
       annee,
       valeur
from stats.collectivite c
         join public.indicateur_resultat ir using (collectivite_id)
where valeur is not null
order by collectivite_id, annee;

create function
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
comment on function stats.refresh_reporting is
    'Rafraichit les vues matérialisées.';

COMMIT;

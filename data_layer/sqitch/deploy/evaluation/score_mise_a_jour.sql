-- Deploy tet:evaluation/score_mise_a_jour to pg

BEGIN;

create type evaluation.update
as enum ('statut', 'réponse', 'activation');
comment on type evaluation.update
    is 'Le type de changement dans les données qui peut nécessiter une évaluation.';

-- Change le `created_at` autrefois écrit par le business en `modified_at`
alter table client_scores
    rename column score_created_at to modified_at;
select private.add_modified_at_trigger('public', 'client_scores');

create view evaluation.collectivite_latest_update
as
with recent as
         (
             -- les statuts
             select collectivite_id, max(modified_at) as latest, 'statut'::evaluation.update as type
             from action_statut
             group by collectivite_id
             union all

             -- les réponses
             select collectivite_id, max(modified_at), 'réponse'
             from reponse_choix
             group by collectivite_id
             union all
             select collectivite_id, max(modified_at), 'réponse'
             from reponse_binaire
             group by collectivite_id
             union all
             select collectivite_id, max(modified_at), 'réponse'
             from reponse_proportion
             group by collectivite_id
             union all

             -- les activations, soit les premières fois qu'une collectivité est rejointe
             select collectivite_id, max(modified_at), 'activation'
             from private_utilisateur_droit
             where active
             group by collectivite_id
             having count(*) = 1)

select collectivite_id, latest, type
from recent
order by latest desc;
comment on view evaluation.collectivite_latest_update
    is 'Les derniers changement des données des collectivités.';

create view evaluation.content_latest_update
as
with json_content as (select created_at
                      from personnalisations_json
                      union all
                      select created_at
                      from referentiel_json)
select max(created_at) as latest
from json_content;
comment on view evaluation.content_latest_update
    is 'Les derniers changements dans les contenus';

create view evaluation.late_collectivite
as
with data_latest as (select collectivite_id, max(latest) as latest
                     from evaluation.collectivite_latest_update
                     group by collectivite_id
                     order by latest desc),
     score_latest as (select collectivite_id, max(modified_at) as latest
                      from client_scores
                      group by collectivite_id),
     with_users as (select distinct c.id
                    from collectivite c
                             join private_utilisateur_droit pud on c.id = pud.collectivite_id
                    where active)
select c.id                                                            as collectivite_id,
       s.latest                                                        as score,
       d.latest                                                        as data,
       clu.latest                                                      as content,
       clu.latest > s.latest                                           as fresher_content,
       d.latest > s.latest                                             as fresher_data,
       s is null                                                       as no_score,
       (clu.latest > s.latest) or (d.latest > s.latest) or (s is null) as late
from with_users c
         left join score_latest s on s.collectivite_id = c.id
         left join data_latest d on d.collectivite_id = c.id
         left join evaluation.content_latest_update clu on true;
comment on view evaluation.late_collectivite
    is 'Les collectivités avec leur statut `late` '
        'qui indique que leurs scores sont en retard par rapport aux contenus ou aux modifications apportées au données';


create function
    evaluation.update_late_collectivite_scores(max int)
    returns void
as
$$
select evaluation.evaluate_regles(collectivite_id,
                                  'personnalisation_consequence',
                                  'client_scores')
from evaluation.late_collectivite
where late
order by data desc
limit update_late_collectivite_scores.max;
$$ language sql security definer;
comment on function evaluation.update_late_collectivite_scores
    is 'Appel le service d''évaluation pour un maximum de [max] collectivités en retard.';


COMMIT;

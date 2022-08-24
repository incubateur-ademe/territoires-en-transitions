-- Deploy tet:collectivite/historique to pg

BEGIN;

create view historique
as
with
    -- les listes des actions par question
    question_actions as (select question_id, array_agg(action_id) as action_ids
                         from question_action
                         group by question_id),

-- l'union des historiques
    historiques as (select -- common columns
                           'action_statut'                         as type,
                           collectivite_id,
                           modified_by                             as modified_by_id,
                           previous_modified_by                    as previous_modified_by_id,
                           modified_at,
                           previous_modified_at,
                           -- common to action related
                           action_id,
                           -- statuts
                           avancement,
                           coalesce(previous_avancement,
                                    'non_renseigne') :: avancement as previous_avancement,
                           avancement_detaille,
                           previous_avancement_detaille,
                           concerne,
                           previous_concerne,
                           -- precision
                           null::text                              as precision,
                           null::text                              as previous_precision,
                           -- réponse
                           null::question_id                       as question_id,
                           null::question_type                     as question_type,
                           null::jsonb                             as reponse,
                           null::jsonb                             as previous_reponse
                    from historique.action_statut s

                    union all
                    select -- common columns
                           'action_precision',
                           collectivite_id,
                           modified_by,
                           previous_modified_by,
                           modified_at,
                           previous_modified_at,
                           -- common to action related
                           action_id,
                           -- statuts
                           null,
                           null,
                           null,
                           null,
                           null,
                           null,
                           -- precision
                           precision,
                           previous_precision,
                           -- réponse
                           null,
                           null,
                           null,
                           null
                    from historique.action_precision p

                    union all
                    select 'reponse',
                           collectivite_id,
                           modified_by,
                           previous_modified_by,
                           modified_at,
                           previous_modified_at,
                           -- common to action related
                           null,
                           -- statuts
                           null,
                           null,
                           null,
                           null,
                           null,
                           null,
                           -- precision
                           null as precision,
                           null as previous_precision,
                           -- réponse
                           question_id,
                           question_type,
                           reponse,
                           previous_reponse
                    from historique.reponse_display),
    actions as (select * from action_hierarchy ah where ah.type = 'action')

select -- toutes les colonnes des données historisées
       h.*,
       -- utilisateur
       coalesce(ud.prenom || ' ' || ud.nom, 'Équipe territoires en transitions') as modified_by_nom,
       -- colonnes liées au actions
       td.identifiant                                                            as tache_identifiant,
       td.nom                                                                    as tache_nom,
       ad.identifiant                                                            as action_identifiant,
       ad.nom                                                                    as action_nom,
       -- colonnes liées aux questions
       q.formulation                                                             as question_formulation,
       q.thematique_id                                                           as thematique_id,
       qt.nom                                                                    as thematique_nom,
       -- permet au client de filtrer par action_id tout les types de données historisées
       coalesce(qa.action_ids, array [h.action_id])                              as action_ids
from historiques h
         left join actions ah on h.action_id = any (ah.descendants)
         left join action_definition ad on ah.action_id = ad.action_id -- definition de l'action
         left join action_definition td on h.action_id = td.action_id -- definition de la tache
         left join utilisateur.dcp_display ud on h.modified_by_id = ud.user_id -- utilisateur nom
         left join question q on h.question_id = q.id
         left join question_thematique qt on q.thematique_id = qt.id
         left join question_actions qa on h.question_id = qa.question_id
where have_lecture_acces(h.collectivite_id) -- limit access
order by h.modified_at desc;

COMMIT;

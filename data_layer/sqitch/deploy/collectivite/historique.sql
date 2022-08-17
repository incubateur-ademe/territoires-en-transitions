-- Deploy tet:collectivite/historique to pg

BEGIN;

create view historique
as
with historiques as (select -- common columns
                            'action_statut'                         as type,
                            collectivite_id,
                            modified_by,
                            previous_modified_by,
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
                            null::json                              as reponse -- json value
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
                            null as question_id,
                            null as reponse_type,
                            null as reponse -- json value
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
                            reponse -- json value
                     from historique.reponse_display),
     actions as (select * from action_hierarchy ah where ah.type = 'action')

select h.*,
       td.identifiant                                                            as tache_identifiant,
       td.nom                                                                    as tache_nom,
       ad.identifiant                                                            as action_identifiant,
       ad.nom                                                                    as action_nom,
       coalesce(ud.prenom || ' ' || ud.nom, 'Équipe territoires en transitions') as modified_by_nom
from historiques h
         left join actions ah on h.action_id = any (ah.descendants)
         left join action_definition ad on ah.action_id = ad.action_id -- definition de l'action
         left join action_definition td on h.action_id = td.action_id -- definition de la tache
         left join utilisateur.dcp_display ud on h.modified_by = ud.user_id
where have_lecture_acces(h.collectivite_id) -- limit access
order by h.modified_at desc;

COMMIT;

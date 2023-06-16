-- Deploy tet:collectivite/historique to pg

BEGIN;

create or replace view historique
as
-- l'union des historiques
select -- common columns
       'action_statut'                                               as type,
       collectivite_id,
       coalesce(modified_by, '99999999-9999-9999-9999-999999999999') as modified_by_id,
       previous_modified_by                                          as previous_modified_by_id,
       s.modified_at,
       previous_modified_at,
       -- common to action related
       s.action_id,
       -- statuts
       avancement,
       coalesce(previous_avancement,
                'non_renseigne') :: avancement                       as previous_avancement,
       avancement_detaille,
       previous_avancement_detaille,
       concerne,
       previous_concerne,
       -- precision sur les actions
       null::text                                                    as precision,
       null::text                                                    as previous_precision,
       -- réponse
       null::question_id                                             as question_id,
       null::question_type                                           as question_type,
       null::jsonb                                                   as reponse,
       null::jsonb                                                   as previous_reponse,
       -- justification aux réponses
       null::text                                                    as justification,
       null::text                                                    as previous_justification,
       -- utilisateur
       (select utilisateur.modified_by_nom(modified_by))             as modified_by_nom,
       -- colonnes liées au actions
       td.identifiant                                                as tache_identifiant,
       td.nom                                                        as tache_nom,
       ad.identifiant                                                as action_identifiant,
       ad.nom                                                        as action_nom,
       -- colonnes liées aux questions
       null::text                                                    as question_formulation,
       null::varchar(30)                                                    as thematique_id,
       null::text                                                    as thematique_nom,
       -- permet au client de filtrer par action_id tout les types de données historisées
       array [s.action_id]::action_id[]                              as action_ids

from historique.action_statut s
         left join private.action_node ah on s.action_id = any (ah.descendants) and ah.type = 'action'
         left join action_definition ad on ah.action_id = ad.action_id -- definition de l'action
         left join action_definition td on s.action_id = td.action_id -- definition de la tache
where have_lecture_acces(s.collectivite_id)

union all
select -- common columns
       'action_precision',
       collectivite_id,
       coalesce(modified_by, '99999999-9999-9999-9999-999999999999'),
       previous_modified_by,
       p.modified_at,
       previous_modified_at,
       -- common to action related
       p.action_id,
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
       null,
       -- justification aux réponses
       null,
       null,
       -- utilisateur
       (select utilisateur.modified_by_nom(modified_by)),
       -- colonnes liées au actions
       td.identifiant,
       td.nom,
       ad.identifiant,
       ad.nom,
       -- colonnes liées aux questions
       null,
       null,
       null,
       -- permet au client de filtrer par action_id tout les types de données historisées
       array [p.action_id]::action_id[] as action_ids
from historique.action_precision p
         left join private.action_node ah on p.action_id = any (ah.descendants) and type = 'action'
         left join action_definition ad on ah.action_id = ad.action_id -- definition de l'action
         left join action_definition td on p.action_id = td.action_id -- definition de la tache
where have_lecture_acces(p.collectivite_id) -- limit access

union all
select 'reponse',
       collectivite_id,
       coalesce(modified_by, '99999999-9999-9999-9999-999999999999'),
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
       r.question_id,
       question_type,
       reponse,
       previous_reponse,
       -- justification
       (select texte
        from historique.justification h
        where h.collectivite_id = r.collectivite_id
          and h.question_id = r.question_id
          and h.modified_at <= r.modified_at
        order by h.modified_at desc
        limit 1),
       null,
       -- utilisateur
       (select utilisateur.modified_by_nom(modified_by)),
       -- colonnes liées au actions
       null,
       null,
       null,
       null,
       -- colonnes liées aux questions
       q.formulation,
       q.thematique_id,
       qt.nom,
       -- permet au client de filtrer par action_id tout les types de données historisées
       (select array_agg(action_id)
        from question_action
        where question_id = r.question_id
        group by question_id)
from historique.reponse_display r
         left join question q on r.question_id = q.id
         left join question_thematique qt on q.thematique_id = qt.id
where have_lecture_acces(r.collectivite_id) -- limit access

union all
select 'justification',
       collectivite_id,
       coalesce(modified_by, '99999999-9999-9999-9999-999999999999'),
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
       j.question_id,
       q.type,
       (select reponse
        from historique.reponse_display h
        where h.modified_at <= j.modified_at
          and h.collectivite_id = j.collectivite_id
          and h.question_id = j.question_id
        order by h.modified_at desc
        limit 1),
       null,
       -- justification
       texte,
       previous_texte,
       -- utilisateur
       (select utilisateur.modified_by_nom(modified_by)),
       -- colonnes liées au actions
       null,
       null,
       null,
       null,
       -- colonnes liées aux questions
       q.formulation,
       q.thematique_id,
       qt.nom,
       -- permet au client de filtrer par action_id tout les types de données historisées
       (select array_agg(action_id)
        from question_action
        where question_id = j.question_id
        group by question_id)
from historique.justification j
         left join question q on q.id = j.question_id
         left join question_thematique qt on q.thematique_id = qt.id
where have_lecture_acces(j.collectivite_id) -- limit access
;


create or replace view historique_utilisateur
as
select collectivite_id,
       modified_by_id,
       (select utilisateur.modified_by_nom(modified_by_id))
from historique
group by collectivite_id, modified_by_id;


create index has_idx_cid on historique.action_statut (collectivite_id);
create index has_idx_mat on historique.action_statut (modified_at);
create index has_idx_cid_mby on historique.action_statut (collectivite_id, modified_by);

create index hap_idx_cid on historique.action_precision (collectivite_id);
create index hap_idx_mat on historique.action_precision (modified_at);
create index hap_idx_cid_mby on historique.action_precision (collectivite_id, modified_by);

create index hj_idx_cid on historique.justification (collectivite_id);
create index hj_idx_mat on historique.justification (modified_at);
create index hj_idx_cid_mby on historique.justification (collectivite_id, modified_by);

create index hrb_idx_cid on historique.reponse_binaire (collectivite_id);
create index hrb_idx_mat on historique.reponse_binaire (modified_at);
create index hrb_idx_cid_mby on historique.reponse_binaire (collectivite_id, modified_by);

create index hrc_idx_cid on historique.reponse_choix (collectivite_id);
create index hrc_idx_mat on historique.reponse_choix (modified_at);
create index hrc_idx_cid_mby on historique.reponse_choix (collectivite_id, modified_by);

create index hrp_idx_cid on historique.reponse_proportion (collectivite_id);
create index hrp_idx_mat on historique.reponse_proportion (modified_at);
create index hrp_idx_cid_mby on historique.reponse_proportion (collectivite_id, modified_by);

COMMIT;

-- Deploy tet:retool/evaluation to pg

BEGIN;

create view retool_preuves
as
select preuve.collectivite_id,
       nc.nom,
       action ->> 'referentiel' as referentiel,
       action ->> 'identifiant' as action,
       preuve_type,
       fichier ->> 'filename'   as fichier,
       lien ->> 'url'           as lien,
       created_at
from preuve
         join named_collectivite nc on nc.collectivite_id = preuve.collectivite_id
    and created_at is not null
where is_service_role()
order by collectivite_id, referentiel, naturalsort(action ->> 'identifiant');

create view retool_score
as
select c.collectivite_id                                              as collectivite_id,
       c.nom                                                          as "Collectivité",

       d.referentiel,
       d.identifiant                                                  as "Identifiant",
       d.nom                                                          as "Titre",
       sc.point_potentiel                                             as "Points potentiels",
       sc.point_fait                                                  as "Points realisés",

       case
           when sc.point_potentiel = 0 then 0
           else sc.point_fait / sc.point_potentiel * 100 end          as "Pourcentage réalisé",

       sc.point_programme                                             as "Points programmés",
       case
           when sc.point_programme = 0 then 0
           else sc.point_programme / sc.point_potentiel * 100 end     as "Pourcentage programmé",

       case
           when sc.point_potentiel = 0 then 0
           else sc.point_non_renseigne / sc.point_potentiel * 100 end as "Pourcentage non renseigné",

       case
           when not sc.concerne or sc.desactive
               then 'Non concerné'
           when sc.point_non_renseigne = sc.point_potentiel
               then 'Non renseigné'
           else
               coalesce(s.avancement::varchar, '')
           end
                                                                      as "Avancement",

       case
           when ah.type = 'sous-action'
               -- fusionne les commentaires
               then coalesce(ac.commentaire || E'\n', '') || (select string_agg(('- ' || a.commentaire), E'\n')
                                                              from action_commentaire a
                                                              where a.collectivite_id = c.collectivite_id
                                                                and a.action_id = any (ah.descendants)
                                                                and a.commentaire != '')
           else ac.commentaire end                                    as "Commentaires fusionnés",

       ac.commentaire                                                 as "Commentaire"

from named_collectivite c
         -- definitions
         left join action_definition d on true
         join action_hierarchy ah on d.action_id = ah.action_id
    -- collectivité data
         left join action_statut s on c.collectivite_id = s.collectivite_id and s.action_id = d.action_id
         left join private.action_scores sc on c.collectivite_id = sc.collectivite_id and sc.action_id = d.action_id
         left join action_commentaire ac on d.action_id = ac.action_id and c.collectivite_id = ac.collectivite_id
where is_service_role()
order by c.collectivite_id,
         d.referentiel,
         naturalsort(d.identifiant);

COMMIT;

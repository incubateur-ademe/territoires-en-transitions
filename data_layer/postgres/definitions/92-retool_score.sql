create view retool_score as
with p as (select collectivite_id,
                  action_id,
                  array_agg(coalesce(preuve.url, preuve.filename)) as preuves
           from preuve
           group by collectivite_id, action_id)
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

       case
           when sc.point_potentiel = 0 then 0
           else sc.point_non_renseigne / sc.point_potentiel * 100 end as "Pourcentage non renseigné",

       coalesce(s.avancement::varchar, '')                            as "Avancement",
       not sc.concerne or sc.desactive                                as "Non concerné",
       ac.commentaire                                                 as "Commentaire",
       p.preuves                                                      as "Preuves"

from named_collectivite c
         -- definitions
         left join action_definition d on true
    -- collectivité data
         left join action_statut s on c.collectivite_id = s.collectivite_id and s.action_id = d.action_id
         left join private.action_scores sc on c.collectivite_id = sc.collectivite_id and sc.action_id = d.action_id
         left join p on s.collectivite_id = p.collectivite_id and s.action_id = p.action_id
         left join action_commentaire ac on s.action_id = ac.action_id and s.collectivite_id = ac.collectivite_id

order by c.collectivite_id,
         naturalsort(d.identifiant);

comment on view retool_score is
    'Scores et colonnes nécessaire pour les exports retool pour les audits.';

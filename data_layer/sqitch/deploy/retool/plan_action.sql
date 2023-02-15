-- Deploy tet:retool/plan_action to pg

BEGIN;

/*
 Vue générale “usage” de la fonctionnalité :
 - nom collectivités
 - nombre de plans en ligne
 - nombre de fiches en ligne
 - date dernière modification d’une fiche
 - TODO nombre d’utilisateurs différents ayant agi sur l’onglet plans d’action
 */
create view retool_plan_action_usage as
select col.collectivite_id,
       col.nom,
       count(distinct axe.id) as nb_plans,
       count(distinct fac.id) as nb_fiches,
       max(fac.modified_at) as derniere_modif,
       null as nb_utilisateurs
from named_collectivite col
         left join axe on axe.collectivite_id = col.collectivite_id
         left join fiche_action fac on fac.collectivite_id = col.collectivite_id
where axe.parent is null
group by col.collectivite_id, col.nom;

/*
 Progression hebdo :
 - Nom collectivités
 - création d’une fiche la semaine passée
 - création d’un plan la semaine passée
 */
create view retool_plan_action_hebdo as
with
    weeks as (
        select *
        from generate_series(DATE '2023-01-02', now(), '7 day') day
    ),
    collectivites_by_weeks as (
        select nc.*, w.day
        from named_collectivite nc
                 left join lateral (select * from weeks) w on true
        order by nc.collectivite_id
    ),
    plans as (
        select cw.collectivite_id, cw.day, count(p.id) as nb_plans, array_agg(distinct dcp.email) as contributeurs
        from collectivites_by_weeks cw
                 left join (select * from axe where parent is null) p
                           on p.collectivite_id = cw.collectivite_id
                               and p.created_at >= cw.day
                               and p.created_at < cw.day + interval '7 day'
                 left join (select * from dcp where limited = false and deleted = false) dcp on p.modified_by = dcp.user_id
        group by cw.collectivite_id, cw.day
    ),
    fiches as (
        select cw.collectivite_id, cw.day, count(f.id) as nb_fiches, array_agg(distinct dcp.email) as contributeurs
        from collectivites_by_weeks cw
                 left join fiche_action f
                           on f.collectivite_id = cw.collectivite_id
                               and f.created_at >= cw.day
                               and f.created_at < cw.day + interval '7 day'
                 left join (select * from dcp where limited = false and deleted = false) dcp on f.modified_by = dcp.user_id
        group by cw.collectivite_id, cw.day
    )
select c.collectivite_id,
       c.nom,
       concat(c.day::date, ' - ', (c.day + interval '6' day)::date) as date_range,
       p.nb_plans,
       f.nb_fiches,
       (
           select array_remove(array_agg(distinct val), null)
           from unnest(array_cat(p.contributeurs, f.contributeurs)) val
       ) as contributeurs,
       c.day
from collectivites_by_weeks c
         join plans p on c.collectivite_id = p.collectivite_id and c.day = p.day
         join fiches f on c.collectivite_id = f.collectivite_id and c.day = f.day
where p.nb_plans <> 0 or f.nb_fiches <> 0
    and is_service_role()
order by c.day desc, c.collectivite_id;

COMMIT;

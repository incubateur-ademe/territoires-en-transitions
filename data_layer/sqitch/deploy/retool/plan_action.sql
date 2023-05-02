-- Deploy tet:retool/plan_action to pg

BEGIN;

create materialized view private.retool_plan_action_premier_usage as
with
    first as (
        with
            fiche_axe as (
                with
                    min_fiche as (
                        -- Récupère la première fiche par collectivité
                        with min_fiche as (
                            select collectivite_id, min(created_at) as created_at
                            from fiche_action
                            group by collectivite_id
                        )
                             -- Prend la fiche avec le plus petit id quand plusieurs ont la même date
                        select fa.collectivite_id, min(fa.id) as id
                        from fiche_action fa
                                 join min_fiche mf on mf.collectivite_id = fa.collectivite_id
                            and mf.created_at = fa.created_at
                        group by fa.collectivite_id
                    ),
                    min_axe as (
                        -- Récupère le premier axe par collectivité
                        with min_axe as (
                            select collectivite_id, min(created_at) as created_at
                            from axe
                            group by collectivite_id
                        )
                             -- Prend l'axe avec le plus petit id quand plusieurs ont la même date
                        select a.collectivite_id, min(a.id) as id
                        from axe a
                                 join min_axe ma on ma.collectivite_id = a.collectivite_id
                            and ma.created_at = a.created_at
                        group by a.collectivite_id
                    )
                    -- Assemble les fiches et les axes
                select fa.collectivite_id, fa.created_at, fa.modified_by, true as fiche
                from fiche_action fa
                         join min_fiche using(id)
                union
                select a.collectivite_id, a.created_at, a.modified_by, false as fiche
                from axe a
                         join min_axe using(id)
            ),
            min_fiche_axe as (
                -- Récupère la fiche ou l'axe créé en premier par la collectivité
                select collectivite_id, min(created_at) as created_at
                from fiche_axe
                group by collectivite_id
            )
            -- Complète les informations de la première utilisation
        select fa.collectivite_id, fa.created_at, fa.fiche, dcp.email
        from fiche_axe fa
                 join min_fiche_axe mfa on fa.collectivite_id = mfa.collectivite_id
            and fa.created_at = mfa.created_at
                 left join dcp on fa.modified_by = dcp.user_id
        order by fa.fiche
    )
select nc.collectivite_id,
       nc.nom,
       f.fiche,
       f.created_at,
       f.email
from stats.collectivite nc
         join lateral (
    -- Si premier axe et fiche créé en même temps (import), on en prend qu'un (la fiche via order by)
    select *
    from first f
    where f.collectivite_id = nc.collectivite_id
    limit 1
    ) f on true
order by created_at desc;
comment on materialized view private.retool_plan_action_premier_usage is
    'Vue pour identifier la toute première utilisation de la fonctionnalité plan action
    par les collectivités.';

create view retool_plan_action_premier_usage as
select * from private.retool_plan_action_premier_usage
where is_service_role();

COMMIT;

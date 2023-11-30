-- Deploy tet:labellisation/export to pg

BEGIN;

create materialized view labellisation.export_score_audit_par_action as
with
    score_audit as (
        with
            last_audit as (
                with last_audit_date as (
                    -- Récupérer le dernier audit par collectivité
                    select collectivite_id, referentiel, max(date_debut) as date_debut
                    from labellisation.audit
                    where date_debut is not null
                    group by collectivite_id, referentiel
                )
                select a.*
                from labellisation.audit a
                         join last_audit_date l
                              on a.collectivite_id = l.collectivite_id
                                  and a.date_debut = l.date_debut
                                  and a.referentiel = l.referentiel
            ),
            table_scores as (
                select a.id as audit_id, ccs.*
                from last_audit a
                         join client_scores cs
                              on cs.collectivite_id = a.collectivite_id and cs.referentiel = a.referentiel
                         join private.convert_client_scores(cs.scores) ccs on true
                where a.date_fin is null
                union
                select a.id as audit_id, ccs.*
                from last_audit a
                         join post_audit_scores pas
                              on pas.collectivite_id = a.collectivite_id and pas.referentiel = a.referentiel
                         join private.convert_client_scores(pas.scores) ccs on true
                where a.date_fin is not null
            )
        -- Récupérer les scores d'audit
        select a.collectivite_id,
               a.referentiel,
               s.action_id,
               a.date_fin,
               case
                   when (s.point_potentiel)::float = 0.0
                       then (s.fait_taches_avancement)::float / (s.total_taches_count)::float
                   else (s.point_fait)::float / (s.point_potentiel)::float
                   end as realise,
               case
                   when (s.point_potentiel)::float = 0.0
                       then (s.programme_taches_avancement)::float / (s.total_taches_count)::float
                   else (s.point_programme)::float / (s.point_potentiel)::float
                   end as programme,
               (s.point_potentiel)::float as points
        from last_audit a
                 join table_scores s on s.audit_id = a.id
                 join action_definition_summary ads on s.action_id = ads.id
        where ads.type not in ('referentiel', 'tache')
    ),
    collectivite_active as (
        -- Récupérer les collectivités actives :
        -- N'utilise pas la vu active_collectivite car il y a is_authenticated()
        select named_collectivite.collectivite_id
        from named_collectivite
                 join private_utilisateur_droit
                      on named_collectivite.collectivite_id = private_utilisateur_droit.collectivite_id
        where private_utilisateur_droit.active
          and not (named_collectivite.collectivite_id in (
            select collectivite_test.collectivite_id
            from collectivite_test
        ))
        group by named_collectivite.collectivite_id
    )
-- Créer la vue
select
    cci.collectivite_id as collectivite_id,
    cci.nom as collectivite,
    cci.region_name as region,
    cot is not null as cot,
    nc.nom as signataire,
    sa.action_id,
    sa.realise as realise,
    sa.programme as programme,
    sa.points as points,
    sa.date_fin as date_cloture
from collectivite_carte_identite cci
         join collectivite_active ca on cci.collectivite_id = ca.collectivite_id
         left join cot on cci.collectivite_id = cot.collectivite_id
         left join named_collectivite nc on cot.signataire = nc.collectivite_id
         left join score_audit sa on cci.collectivite_id = sa.collectivite_id
where sa is not null
ORDER BY cci.nom;

create view public.export_score_audit_par_action as
select *
from labellisation.export_score_audit_par_action
where is_service_role();

COMMIT;

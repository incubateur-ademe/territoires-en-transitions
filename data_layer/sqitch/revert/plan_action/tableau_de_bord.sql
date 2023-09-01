-- Deploy tet:plan_action/tableau_de_bord to pg

BEGIN;

drop index fiche_action_axe_fiche_id_index;
drop index axe_collectivite_id_index;
drop index axe_collectivite_id_id_index;
drop index axe_parent_id_index;
drop index axe_parent_index;

create or replace function plan_action_tableau_de_bord(collectivite_id integer, plan_id integer DEFAULT NULL::integer,
                                                       sans_plan boolean DEFAULT false) returns plan_action_tableau_de_bord
    security definer
    language sql
as
$$
with fiches as (select distinct fa.*,
                                case
                                    when fa.statut not in ('À venir', 'En cours', 'En pause')
                                        then 'NC'
                                    when fa.amelioration_continue
                                        then 'Action en amélioration continue'
                                    when fa.date_fin_provisoire is null
                                        then 'Date de fin non renseignée'
                                    when fa.date_fin_provisoire < now()
                                        then 'Échéance dépassée'
                                    when fa.date_fin_provisoire < (now() + interval '3 months')
                                        then 'Échéance dans moins de trois mois'
                                    when fa.date_fin_provisoire < (now() + interval '1 year')
                                        then 'Échéance entre trois mois et 1 an'
                                    else 'Échéance dans plus d’un an'
                                    end as echeance
                from fiche_action fa
                         left join fiche_action_axe faa on faa.fiche_id = fa.id
                         left join plan_action_chemin pac on faa.axe_id = pac.axe_id
                where case
                          when plan_action_tableau_de_bord.plan_id is not null
                              then pac.plan_id = plan_action_tableau_de_bord.plan_id
                          when sans_plan
                              then faa is null
                          else true
                    end
                  and fa.collectivite_id = plan_action_tableau_de_bord.collectivite_id
                  and can_read_acces_restreint(fa.collectivite_id)),
     personnes as (select *
                   from personnes_collectivite(plan_action_tableau_de_bord.collectivite_id))
select case
           when can_read_acces_restreint(plan_action_tableau_de_bord.collectivite_id) then
               plan_action_tableau_de_bord.collectivite_id end as collectivite_id,
       case
           when can_read_acces_restreint(plan_action_tableau_de_bord.collectivite_id) then
               plan_action_tableau_de_bord.plan_id end         as plan_id,
       (select array_agg((t.*)::graphique_tranche) as statuts
        from (select coalesce(statut::text, 'NC') as id, count(*) as value
              from fiches
              group by coalesce(statut::text, 'NC')) t),
       (select array_agg((t.*)::graphique_tranche) as pilotes
        from (select coalesce(p.nom, 'NC') as id, count(f.*) as value
              from fiches f
                       left join fiche_action_pilote fap on fap.fiche_id = f.id
                       left join personnes p on fap.user_id = p.user_id or fap.tag_id = p.tag_id
              group by coalesce(p.nom, 'NC')) t),
       (select array_agg((t.*)::graphique_tranche) as referents
        from (select coalesce(p.nom, 'NC') as id, count(f.*) as value
              from fiches f
                       left join fiche_action_referent far on far.fiche_id = f.id
                       left join personnes p on far.user_id = p.user_id or far.tag_id = p.tag_id
              group by coalesce(p.nom, 'NC')) t),
       (select array_agg((t.*)::graphique_tranche) as priorites
        from (select coalesce(niveau_priorite::text, 'NC') as id, count(*) as value
              from fiches
              group by coalesce(niveau_priorite::text, 'NC')) t),
       (select array_agg((t.*)::graphique_tranche) as echeances
        from (select echeance as id, count(*) as value
              from fiches
              where echeance <> 'NC'
              group by echeance) t)
$$;

COMMIT;

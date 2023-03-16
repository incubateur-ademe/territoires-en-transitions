-- Deploy tet:plan_action/tableau_de_bord to pg

BEGIN;

create table typage.graphique_tranche (
                                          label text primary key,
                                          value integer not null
);

create table typage.plan_action_tableau_de_bord (
                                                    collectivite_id integer references collectivite not null,
                                                    plan_id integer references axe,
                                                    statuts typage.graphique_tranche[],
                                                    pilotes typage.graphique_tranche[],
                                                    referents typage.graphique_tranche[],
                                                    priorites typage.graphique_tranche[]
);


create function plan_action_tableau_de_bord(collectivite_id integer, plan_id integer, sans_plan boolean)
    returns typage.plan_action_tableau_de_bord as
$$
with
    fiches as (
        select fa.*
        from fiche_action fa
                 left join fiche_action_axe faa on faa.fiche_id = fa.id
                 left join plan_action_chemin pac on faa.axe_id = pac.axe_id
        where
            case
                when plan_action_tableau_de_bord.plan_id is not null
                    then pac.plan_id = plan_action_tableau_de_bord.plan_id
                when sans_plan
                    then faa is null
                else fa.collectivite_id = plan_action_tableau_de_bord.collectivite_id
                end

    ),
    personnes as (
        select *
        from personnes_collectivite(plan_action_tableau_de_bord.collectivite_id)
    )
select
    plan_action_tableau_de_bord.collectivite_id,
    plan_action_tableau_de_bord.plan_id,
    (
        select array_agg((t.*)::typage.graphique_tranche) as statuts
        from (
                 select coalesce(statut::text, 'non défini') as label, count(*) as value
                 from fiches
                 group by coalesce(statut::text, 'non défini')
             ) t
    ),
    (
        select array_agg((t.*)::typage.graphique_tranche) as pilotes
        from (
                 select coalesce(p.nom, 'non défini') as label, count(f.*) as value
                 from fiches f
                          left join fiche_action_pilote fap on fap.fiche_id = f.id
                          left join personnes p on fap.user_id = p.user_id or fap.tag_id = p.tag_id
                 group by coalesce(p.nom, 'non défini')
             ) t
    ),
    (
        select array_agg((t.*)::typage.graphique_tranche) as referents
        from (select coalesce(p.nom, 'non défini') as label, count(f.*) as value
              from fiches f
                       left join fiche_action_referent far on far.fiche_id = f.id
                       left join personnes p on far.user_id = p.user_id or far.tag_id = p.tag_id
              group by coalesce(p.nom, 'non défini')
             ) t
    ),
    (
        select array_agg((t.*)::typage.graphique_tranche) as priorites
        from (
                 select coalesce(niveau_priorite::text, 'non défini') as label, count(*) as value
                 from fiches
                 group by coalesce(niveau_priorite::text, 'non défini')
             ) t
    )
$$ language sql;
comment on function plan_action_tableau_de_bord is
    'Retourne les données pour faire des diagrammes circulaires sur les
    statuts, pilotes, référents, et priorités des fiches actions,
    en fonction de la collectivité et/ou d''un plan d''action';



COMMIT;

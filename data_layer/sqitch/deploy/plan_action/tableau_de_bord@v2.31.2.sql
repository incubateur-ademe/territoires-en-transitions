-- Deploy tet:plan_action/tableau_de_bord to pg

BEGIN;

create type graphique_tranche as
(
    id text,
    value integer
);

create type plan_action_tableau_de_bord as
(
    collectivite_id integer,
    plan_id integer,
    statuts graphique_tranche[],
    pilotes graphique_tranche[],
    referents graphique_tranche[],
    priorites graphique_tranche[]
);


create function plan_action_tableau_de_bord(
    collectivite_id integer,
    plan_id integer default null,
    sans_plan boolean default false
)
    returns plan_action_tableau_de_bord as
$$
with
    fiches as (
        select distinct fa.*
        from fiche_action fa
                 left join fiche_action_axe faa on faa.fiche_id = fa.id
                 left join plan_action_chemin pac on faa.axe_id = pac.axe_id
        where
            case
                when plan_action_tableau_de_bord.plan_id is not null
                    then pac.plan_id = plan_action_tableau_de_bord.plan_id
                when sans_plan
                    then faa is null
                else true
                end
          and fa.collectivite_id = plan_action_tableau_de_bord.collectivite_id
          and is_authenticated()

    ),
    personnes as (
        select *
        from personnes_collectivite(plan_action_tableau_de_bord.collectivite_id)
    )
select
    plan_action_tableau_de_bord.collectivite_id,
    plan_action_tableau_de_bord.plan_id,
    (
        select array_agg((t.*)::graphique_tranche) as statuts
        from (
                 select coalesce(statut::text, 'NC') as id, count(*) as value
                 from fiches
                 group by coalesce(statut::text, 'NC')
             ) t
    ),
    (
        select array_agg((t.*)::graphique_tranche) as pilotes
        from (
                 select coalesce(p.nom, 'NC') as id, count(f.*) as value
                 from fiches f
                          left join fiche_action_pilote fap on fap.fiche_id = f.id
                          left join personnes p on fap.user_id = p.user_id or fap.tag_id = p.tag_id
                 group by coalesce(p.nom, 'NC')
             ) t
    ),
    (
        select array_agg((t.*)::graphique_tranche) as referents
        from (select coalesce(p.nom, 'NC') as id, count(f.*) as value
              from fiches f
                       left join fiche_action_referent far on far.fiche_id = f.id
                       left join personnes p on far.user_id = p.user_id or far.tag_id = p.tag_id
              group by coalesce(p.nom, 'NC')
             ) t
    ),
    (
        select array_agg((t.*)::graphique_tranche) as priorites
        from (
                 select coalesce(niveau_priorite::text, 'NC') as id, count(*) as value
                 from fiches
                 group by coalesce(niveau_priorite::text, 'NC')
             ) t
    )
$$ language sql security definer;
comment on function plan_action_tableau_de_bord is
    'Retourne les données pour faire des diagrammes circulaires sur les
    statuts, pilotes, référents, et priorités des fiches actions,
    en fonction de la collectivité et/ou d''un plan d''action';



COMMIT;

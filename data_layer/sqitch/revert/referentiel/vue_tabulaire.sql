-- Deploy tet:referentiel/vue_tabulaire to pg
-- requires: referentiel/contenu
-- requires: referentiel/action_statut
-- requires: evaluation/score_summary

BEGIN;

alter view private.action_hierarchy set schema public;
comment on view public.action_hierarchy is 'Vue dynamique qui calcule la hiérarchie des actions.';

create or replace view action_statuts
as
select
    -- client will filter on:
    c.id                                                                   as collectivite_id,
    d.action_id,
    d.referentiel,
    h.type,
    h.descendants,
    h.ascendants,
    h.depth,
    h.have_children,

    -- and optionally retrieve:
    d.identifiant,
    d.nom,
    d.description,
    d.exemples != ''                                                       as have_exemples,
    d.preuve != ''                                                         as have_preuve,
    d.ressources != ''                                                     as have_ressources,
    d.reduction_potentiel != ''                                            as have_reduction_potentiel,
    d.perimetre_evaluation != ''                                           as have_perimetre_evaluation,
    d.contexte != ''                                                       as have_contexte,
    d.categorie                                                            as phase,

    -- score [0.0, 1.0]
    case
        when sc.point_potentiel = 0 then 0
        else sc.point_fait / sc.point_potentiel end                        as score_realise,
    case
        when sc.point_potentiel = 0 then 0
        else sc.point_programme / sc.point_potentiel end                   as score_programme,
    case
        when sc.point_potentiel = 0 then 0
        else (sc.point_fait + sc.point_programme) / sc.point_potentiel end as score_realise_plus_programme,
    case
        when sc.point_potentiel = 0 then 0
        else sc.point_pas_fait / sc.point_potentiel end                    as score_pas_fait,
    case
        when sc.point_potentiel = 0 then 0
        else sc.point_non_renseigne / sc.point_potentiel end               as score_non_renseigne,

    -- points
    greatest(sc.point_potentiel - sc.point_fait, 0)                        as points_restants,
    sc.point_fait                                                          as points_realises,
    sc.point_programme                                                     as points_programmes,
    sc.point_potentiel                                                     as points_max_personnalises,
    sc.point_referentiel                                                   as points_max_referentiel,

    -- action statuts
    s.avancement,
    s.avancement_detaille,

    -- children status: the set of statuts of all children
    cs.avancements                                                         as avancement_descendants,
    coalesce((not s.concerne), cs.non_concerne, false)                     as non_concerne

from collectivite c
         -- definitions
         left join action_definition d on true
         join public.action_hierarchy h on d.action_id = h.action_id
    -- collectivité data
         left join action_statut s on c.id = s.collectivite_id and s.action_id = d.action_id
         left join private.action_scores sc on c.id = sc.collectivite_id and sc.action_id = d.action_id
    -- loop on every row to aggregate descendants statuts
         left join lateral (
    select case
               -- aucun descendant
               when not h.have_children then
                   '{}'::avancement[]
               -- aucun statut pour les enfants
               when sc.point_non_renseigne = sc.point_potentiel then
                   '{non_renseigne}'::avancement[]
               -- des statuts mais pas pour chaque enfant
               when sc.point_non_renseigne > 0.0 then
                       '{non_renseigne}'::avancement[] ||
                       array_agg(distinct statut.avancement) filter ( where statut.concerne )
               -- des statuts pour chaque enfant
               else
                   array_agg(distinct statut.avancement) filter ( where statut.concerne )
               end
               as avancements,
           not bool_and(statut.concerne)
               as non_concerne
    from action_statut statut
    where c.id = statut.collectivite_id
      and statut.action_id = any (h.leaves)
    ) cs on true
-- remove `desactive` and `non concernes` in one fell swoop.
where sc is null
   or (sc.concerne and not sc.desactive)
order by c.id,
         naturalsort(d.identifiant);

drop materialized view action_referentiel;
drop materialized view private.action_node;
drop function private.to_tabular_score;
drop type tabular_score;

COMMIT;

-- Deploy tet:referentiel/vue_tabulaire to pg
-- requires: referentiel/contenu
-- requires: referentiel/action_statut
-- requires: evaluation/score_summary

BEGIN;

alter view action_hierarchy set schema private;
comment on view private.action_hierarchy
    is 'Vue dynamique qui calcule la hiérarchie des actions. Dépréciée, préférer `private.action_node`.';

create materialized view private.action_node
as
select action_id,
       referentiel,
       descendants,
       leaves,
       have_children,
       ascendants,
       depth,
       type
from private.action_hierarchy;
comment on materialized view private.action_node
    is 'La vue matérialisée des actions.';

create materialized view action_referentiel
as
select -- les champs dérivés des relations.
       ah.action_id,
       ah.referentiel,
       ah.descendants,
       ah.leaves,
       ah.have_children,
       ah.ascendants,
       ah.depth,
       ah.type,

       -- les champs descriptions
       ad.identifiant,
       ad.nom,
       ad.description,
       ad.categorie                  as phase,

       -- les champs dérivés des descriptions
       ad.exemples != ''             as have_exemples,
       ad.preuve != ''               as have_preuve,
       ad.ressources != ''           as have_ressources,
       ad.reduction_potentiel != ''  as have_reduction_potentiel,
       ad.perimetre_evaluation != '' as have_perimetre_evaluation,
       ad.contexte != ''             as have_contexte
from private.action_hierarchy ah
         left join action_definition ad on ah.action_id = ad.action_id;
comment on materialized view action_referentiel
    is 'La vue matérialisée utilisée comme tronc commun pour les vues tabulaires dans le client.';


create type tabular_score as
(
    referentiel                  referentiel,
    action_id                    action_id,
    -- score
    score_realise                double precision,
    score_programme              double precision,
    score_realise_plus_programme double precision,
    score_pas_fait               double precision,
    score_non_renseigne          double precision,
    -- points
    points_restants              double precision,
    points_realises              double precision,
    points_programmes            double precision,
    points_max_personnalises     double precision,
    points_max_referentiel       double precision,
    -- avancement reconstitué
    avancement                   avancement,
    -- booléens
    concerne                     bool,
    desactive                    bool
);
comment on type tabular_score
    is 'Un score utilisé pour être affiché dans le client. ';

create function
    private.to_tabular_score(
    action_score private.action_score
)
    returns tabular_score
begin
    atomic
    select action_score.referentiel,
           action_score.action_id,
           -- score [0.0, 1.0]
           case
               when action_score.point_potentiel = 0 then 0
               else action_score.point_fait / action_score.point_potentiel end,
           case
               when action_score.point_potentiel = 0 then 0
               else action_score.point_programme / action_score.point_potentiel end,
           case
               when action_score.point_potentiel = 0 then 0
               else (action_score.point_fait + action_score.point_programme) /
                    action_score.point_potentiel end,
           case
               when action_score.point_potentiel = 0 then 0
               else action_score.point_pas_fait / action_score.point_potentiel end,
           case
               when action_score.point_potentiel = 0 then 0
               else action_score.point_non_renseigne / action_score.point_potentiel end,
           -- points
           greatest(action_score.point_potentiel - action_score.point_fait, 0),
           action_score.point_fait,
           action_score.point_programme,
           action_score.point_potentiel,
           action_score.point_referentiel,
           -- avancement reconstitué
           case
               when action_score.fait_taches_avancement = 1 then 'fait'
               when action_score.programme_taches_avancement = 1 then 'programme'
               when action_score.pas_fait_taches_avancement = 1 then 'pas_fait'
               when action_score.fait_taches_avancement +
                    action_score.programme_taches_avancement +
                    action_score.pas_fait_taches_avancement = 0 then 'non_renseigne'
               else 'detaille' end::avancement,
           -- booléens
           action_score.concerne,
           action_score.desactive;
end;
comment on function private.to_tabular_score is
    'Convertit un action score en score pour les vues tabulaires.';


create or replace view action_statuts
as
select -- Le client filtre sur:
       c.id                                               as collectivite_id,
       d.action_id,
       d.referentiel,
       d.type,
       d.descendants,
       d.ascendants,
       d.depth,
       d.have_children,

       -- et éventuellement sélectionne:
       d.identifiant,
       d.nom,
       d.description,
       d.have_exemples,
       d.have_preuve,
       d.have_ressources,
       d.have_reduction_potentiel,
       d.have_perimetre_evaluation,
       d.have_contexte,
       d.phase,

       -- les scores [0.0, 1.0]
       sc.score_realise,
       sc.score_programme,
       sc.score_realise_plus_programme,
       sc.score_pas_fait,
       sc.score_non_renseigne,

       -- les points
       sc.points_restants,
       sc.points_realises,
       sc.points_programmes,
       sc.points_max_personnalises,
       sc.points_max_referentiel,

       -- les statuts saisis
       s.avancement,
       s.avancement_detaille,

       -- les statuts des enfants
       cs.avancements                                     as avancement_descendants,
       coalesce((not s.concerne), cs.non_concerne, false) as non_concerne

-- pour chaque collectivité
from collectivite c
         -- on prend les scores au format json pour chaque référentiel
         join client_scores on client_scores.collectivite_id = c.id
    -- que l'on explose en lignes, une par action
         join private.convert_client_scores(client_scores.scores) ccc on true
    -- puis on converti chacune de ces lignes au format approprié pour les vues tabulaires du client
         join private.to_tabular_score(ccc) sc on true
    -- on y join la définition de l'action
         join action_referentiel d on sc.action_id = d.action_id
    -- et les statuts saisis si ils existent (left join)
         left join action_statut s on c.id = s.collectivite_id and s.action_id = d.action_id
    -- pour chacune de ces lignes on agrège les avancements des descendants, afin de pouvoir les filtrer
         left join lateral (
    select case
               -- aucun descendant
               when not d.have_children then
                   '{}'::avancement[]
               -- aucun statut pour les enfants
               when ccc.point_non_renseigne = ccc.point_potentiel then
                   '{non_renseigne}'::avancement[]
               -- des statuts mais pas pour chaque enfant
               when ccc.point_non_renseigne > 0.0 then
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
      and statut.action_id = any (d.leaves)
    ) cs on true
-- on fini par exclure les désactivés et les non concernés.
where sc is null
   or (ccc.concerne and not ccc.desactive)
order by c.id,
         naturalsort(d.identifiant);

COMMIT;

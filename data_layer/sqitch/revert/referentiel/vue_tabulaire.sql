-- Deploy tet:referentiel/vue_tabulaire to pg
-- requires: referentiel/contenu
-- requires: referentiel/action_statut
-- requires: evaluation/score_summary

BEGIN;

drop view action_statuts;
create view action_statuts
as
select -- Le client filtre sur:
       c.id                                               as collectivite_id,
       d.action_id,
       client_scores.referentiel,
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

       -- les flags
       sc.concerne,
       sc.desactive,

       -- les statuts saisis
       s.avancement,
       s.avancement_detaille,

       -- les statuts des enfants
       cs.avancements                                     as avancement_descendants,
       coalesce((not s.concerne), cs.non_concerne, false) as non_concerne,

       -- les statuts du parent pour les tâches
       p.avancement as avancement_parent
-- pour chaque collectivité
from collectivite c
         -- on prend les scores au format json pour chaque référentiel
         join client_scores on client_scores.collectivite_id = c.id
    -- que l'on explose en lignes, une par action
         join lateral private.convert_client_scores(client_scores.scores) ccc on true
    -- puis on converti chacune de ces lignes au format approprié pour les vues tabulaires du client
         join lateral private.to_tabular_score(ccc) sc on true
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
         left join action_relation rel on rel.id = d.action_id
         left join action_statut p on c.id = p.collectivite_id and p.action_id = rel.parent
where est_verifie()
   or have_lecture_acces(c.id)
order by c.id,
         naturalsort(d.identifiant);

alter table private.action_score drop column renseigne;

create or replace function private.convert_client_scores(scores jsonb) returns SETOF private.action_score
    stable
    language sql
as
$$
select (select referentiel from public.action_relation ar where ar.id = (score ->> 'action_id')),
       (score ->> 'action_id')::public.action_id,
       (score ->> 'concerne')::boolean,
       (score ->> 'desactive')::boolean,
       (score ->> 'point_fait')::float,
       (score ->> 'point_pas_fait')::float,
       (score ->> 'point_potentiel')::float,
       (score ->> 'point_programme')::float,
       (score ->> 'point_referentiel')::float,
       (score ->> 'total_taches_count')::integer,
       (score ->> 'point_non_renseigne')::float,
       (score ->> 'point_potentiel_perso')::float,
       (score ->> 'completed_taches_count')::integer,
       (score ->> 'fait_taches_avancement')::float,
       (score ->> 'pas_fait_taches_avancement')::float,
       (score ->> 'programme_taches_avancement')::float,
       (score ->> 'pas_concerne_taches_avancement')::float
from jsonb_array_elements(scores) as score
$$;

COMMIT;

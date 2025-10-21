-- Deploy tet:referentiel/vue_tabulaire to pg
-- requires: referentiel/contenu
-- requires: referentiel/action_statut
-- requires: evaluation/score_summary

BEGIN;

-- referentiels
DROP FUNCTION private.score_summary_of;
DROP FUNCTION private.convert_client_scores;
DROP FUNCTION private.to_tabular_score;
DROP VIEW public.action_statuts;
DROP VIEW evaluation.service_regles;
DROP VIEW evaluation.service_referentiel;
DROP VIEW evaluation.service_statuts;
DROP FUNCTION private.upsert_actions;
DROP FUNCTION private.upsert_referentiel_after_json_insert;
DROP VIEW private.action_node;
DROP FUNCTION private.action_score;
DROP TABLE private.action_score;
DROP FUNCTION historique.action_statuts_at;
DROP FUNCTION labellisation.critere_score_global;
DROP FUNCTION labellisation.referentiel_score;
DROP FUNCTION labellisation.etoiles;
DROP FUNCTION labellisation.evaluate_audit_statuts;
DROP FUNCTION labellisation.audit_personnalisation_payload;
DROP FUNCTION labellisation.update_audit_scores;
DROP FUNCTION labellisation.update_audit_score_on_personnalisation;

-- Drop the triggers that were created
DROP TRIGGER IF EXISTS after_write_update_audit_scores ON personnalisation_consequence;
DROP TRIGGER IF EXISTS after_write_update_audit_scores ON labellisation.audit;
DROP TRIGGER IF EXISTS update_labellisation_after_scores ON post_audit_scores;

DROP FUNCTION labellisation.update_labellisation_after_scores;

-- plans/fiches

DROP VIEW private.fiche_resume;
DROP FUNCTION public.fiche_resume;
DROP VIEW public.filter_fiches_action;
DROP VIEW private.fiches_action;
DROP VIEW public.fiches_action;






alter table private.action_score add column renseigne boolean default true not null;

create or replace function private.convert_client_scores(scores jsonb) returns SETOF private.action_score
    stable
    language sql
as
$$
select (select referentiel from action_relation ar where ar.id = (score ->> 'action_id')),
       (score ->> 'action_id')::action_id,
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
       (score ->> 'pas_concerne_taches_avancement')::float,
       (score ->> 'renseigne')::boolean
from jsonb_array_elements(scores) as score
$$;

drop view action_statuts;
create view action_statuts
as
select -- Le client filtre sur:
       c.id                                               as collectivite_id,
       st.action_id,
       st.referentiel,
       st.type,
       st.descendants,
       st.ascendants,
       st.depth,
       st.have_children,

       -- et éventuellement sélectionne:
       st.identifiant,
       st.nom,
       st.description,
       st.have_exemples,
       st.have_preuve,
       st.have_ressources,
       st.have_reduction_potentiel,
       st.have_perimetre_evaluation,
       st.have_contexte,
       st.phase,

       -- les scores [0.0, 1.0]
       st.score_realise,
       st.score_programme,
       st.score_realise_plus_programme,
       st.score_pas_fait,
       st.score_non_renseigne,

       -- les points
       st.points_restants,
       st.points_realises,
       st.points_programmes,
       st.points_max_personnalises,
       st.points_max_referentiel,

       -- les flags
       st.concerne,
       st.desactive,

       -- les statuts saisis
       st.avancement,
       st.avancement_detaille,

       -- les statuts des enfants
       st.avancement_descendants,
       st.non_concerne,

       -- vrai si l'action est renseignée
       st.renseigne
-- pour chaque collectivité
from collectivite c
left join lateral (
    with statuts as (
                    with acs as (
                                select collectivite_id, action_id, avancement, concerne, avancement_detaille
                                from action_statut
                                where collectivite_id = c.id
                                )
                    select
                        ref.action_id,
                        ref.referentiel,
                        ref.type,
                        ref.descendants,
                        ref.ascendants,
                        ref.depth,
                        ref.have_children,
                        ref.identifiant,
                        ref.nom,
                        ref.description,
                        ref.have_exemples,
                        ref.have_preuve,
                        ref.have_ressources,
                        ref.have_reduction_potentiel,
                        ref.have_perimetre_evaluation,
                        ref.have_contexte,
                        ref.phase,
                        sc.score_realise,
                        sc.score_programme,
                        sc.score_realise_plus_programme,
                        sc.score_pas_fait,
                        sc.score_non_renseigne,
                        sc.points_restants,
                        sc.points_realises,
                        sc.points_programmes,
                        sc.points_max_personnalises,
                        sc.points_max_referentiel,
                        sc.concerne as concerne,
                        sc.desactive,
                        stat.avancement,
                        stat.avancement_detaille,
                        ccc.point_non_renseigne as pnr,
                        ccc.point_potentiel as pp,
                        ccc.renseigne
                    -- on prend les scores au format json pour chaque référentiel
                    from client_scores
                        -- que l'on explose en lignes, une par action
                    join lateral private.convert_client_scores(client_scores.scores) ccc on true
                        -- puis on converti chacune de ces lignes au format approprié pour les vues tabulaires du client
                    join lateral private.to_tabular_score(ccc.*) sc on true
                        -- on y join les définitions de l'action
                    join action_referentiel ref on sc.action_id = ref.action_id
                        -- et les statuts saisis si ils existent (left join)
                    left join acs stat on ref.action_id = stat.action_id
                    where client_scores.collectivite_id = c.id
                    )
    select s.*,
           cs.avancements as avancement_descendants,
           coalesce(not s.concerne, cs.non_concerne, false) as non_concerne
    from statuts s
        -- pour chacune de ces lignes on agrège les avancements des descendants, afin de pouvoir les filtrer
    left join lateral (
        select
            case
                -- aucun descendant
                when not s.have_children
                    then '{}'::avancement[]
                -- aucun statut pour les enfants
                when  s.pp>0.0::double precision and s.pnr = s.pp
                    then '{non_renseigne}'::avancement[]
                -- des statuts mais pas pour chaque enfant
                when s.pnr > 0.0::double precision
                    then '{non_renseigne}'::avancement[] || array_agg(distinct statut.avancement)
                -- des statuts pour chaque enfant
                else array_agg(distinct statut.avancement)
            end as avancements,
            not bool_and(statut.concerne) as non_concerne
        from statuts statut
        where statut.action_id::text = any (s.descendants::text[])
          and statut.renseigne
        ) cs on true
    ) st on true
where est_verifie()
   or have_lecture_acces(c.id)
order by c.id,
         naturalsort(st.identifiant);

COMMIT;

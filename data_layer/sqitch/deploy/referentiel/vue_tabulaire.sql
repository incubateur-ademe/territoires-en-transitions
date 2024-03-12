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

       -- les statuts du parent pour les tâches
       st.avancement_parent
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
                        rel.id as action_id,
                        rel.referentiel,
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
                        case -- Une action est concerné si elle et son parent ont le flag concerne à vrai ou null
                            when par is null or par.concerne is true then
                                case
                                    when stat is null then
                                        coalesce(sc.concerne, true)
                                    else
                                        stat.concerne
                                end
                            else
                                false
                        end as concerne,
                        sc.desactive,
                        stat.avancement,
                        stat.avancement_detaille,
                        par.avancement as avancement_parent,
                        ccc.point_non_renseigne as pnr,
                        ccc.point_potentiel as pp,
                        par.action_id as parent,
                        case -- Redéfini les avancements non renseignés
                        -- Cas tâche null et parent null ou non renseigné -> tâche non renseigné
                            when (
                                stat is null and
                                ref.type = 'tache' and
                                rel.parent is not null and
                                (par is null or par.avancement = 'non_renseigne')
                                ) then
                                'non_renseigne'::avancement
                            -- Cas tâche non renseigné et parent renseigné -> tâche null car parent prévaut
                            when (stat.avancement = 'non_renseigne'
                                and ref.type = 'tache'
                                and (par is not null
                                    or par.avancement <> 'non_renseigne')) then
                                null::avancement
                            -- Cas sous-action non renseigné -> sous-action null pour ne pas écraser les enfants
                            when (stat.avancement = 'non_renseigne' and ref.type = 'sous-action') then
                                null::avancement
                            else
                                stat.avancement
                        end as avancement_calcule
                    -- on prend les scores au format json pour chaque référentiel
                    from client_scores
                        -- que l'on explose en lignes, une par action
                    join lateral private.convert_client_scores(client_scores.scores) ccc on true
                        -- puis on converti chacune de ces lignes au format approprié pour les vues tabulaires du client
                    join lateral private.to_tabular_score(ccc.*) sc on true
                        -- on y join les définitions de l'action
                    join action_relation rel on sc.action_id = rel.id
                    join action_referentiel ref on rel.id = ref.action_id
                        -- et les statuts saisis si ils existent (left join)
                    left join acs stat on rel.id = stat.action_id
                        -- et le statut saisi du parent s'il existe
                    left join acs par on rel.parent = par.action_id
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
                    then '{non_renseigne}'::avancement[] || array_agg(distinct statut.avancement_calcule)
                -- des statuts pour chaque enfant
                else array_agg(distinct statut.avancement_calcule)
            end as avancements,
            not bool_and(statut.concerne) as non_concerne
        from statuts statut
        where statut.action_id::text = any (s.descendants::text[])
          and statut.concerne and not statut.desactive
        ) cs on true
    ) st on true
where est_verifie()
   or have_lecture_acces(c.id)
order by c.id,
         naturalsort(st.identifiant);

COMMIT;

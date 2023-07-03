-- Deploy tet:labellisation/prerequis to pg
-- requires: labellisation/schema
-- requires: labellisation/labellisation
-- requires: referentiel/contenu

BEGIN;

create or replace function
    labellisation.critere_action(collectivite_id integer)
    returns table
            (
                referentiel         referentiel,
                etoiles             labellisation.etoile,
                action_id           action_id,
                formulation         text,
                score_realise       float,
                min_score_realise   float,
                score_programme     float,
                min_score_programme float,
                atteint             bool,
                prio                integer
            )
as
$$
with scores as (select s.*
                from client_scores cs
                         join private.convert_client_scores(cs.scores) s on true
                where cs.collectivite_id = critere_action.collectivite_id)
select ss.referentiel,
       cla.etoile,
       cla.action_id,
       cla.formulation,
       ss.proportion_fait,
       cla.min_realise_percentage,
       ss.proportion_programme,
       cla.min_programme_percentage,
       case
           -- l'action a une sous-action parente `sa`, qui a un statut `exists`
           when sa is not null
               and exists(select *
                          from action_statut s
                          where s.action_id = sa.action_id
                            and s.collectivite_id = critere_action.collectivite_id
                            and s.avancement != 'non_renseigne'
                            and s.concerne)
               then
                   coalesce(sass.proportion_fait * 100 >= cla.min_realise_percentage, false)
                   or coalesce((sass.proportion_programme + sass.proportion_fait) * 100 >=
                               cla.min_programme_percentage, false)
           -- sinon
           else -- le score fait est >= au critère fait
                   coalesce(ss.proportion_fait * 100 >= cla.min_realise_percentage, false)
                   -- le score fait + programme est >= au critère programme
                   or
                   coalesce((ss.proportion_programme + ss.proportion_fait) * 100 >= cla.min_programme_percentage, false)
           end as atteint,
       cla.prio
from labellisation_action_critere cla
         join scores sc on sc.action_id = cla.action_id
         join private.score_summary_of(sc) ss on true
         join private.action_node a on sc.action_id = a.action_id
    -- sous-action parente.
         left join private.action_node sa
                   on a.action_id = any (sa.descendants)
                       and a.type = 'tache'
                       and sa.type = 'sous-action'
    -- score sous-action parente
         left join scores sasc on sa.action_id = sasc.action_id
    -- score summary sous-action parente
         left join private.score_summary_of(sasc) sass on true
where not ss.desactive
$$
    language sql stable;

COMMIT;

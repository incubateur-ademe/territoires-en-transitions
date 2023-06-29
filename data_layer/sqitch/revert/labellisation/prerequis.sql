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
       coalesce(ss.proportion_fait * 100  >= cla.min_realise_percentage, false) or
       coalesce((ss.proportion_programme + ss.proportion_fait) * 100 >= cla.min_programme_percentage, false) as atteint,
       cla.prio
from labellisation_action_critere cla
         join scores sc on sc.action_id = cla.action_id
         join private.score_summary_of(sc) ss on true
where not ss.desactive
$$
    language sql;

COMMIT;

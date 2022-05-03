begin;
select plan(6);

select has_function('labellisation', 'referentiel_score'::name);
select has_function('labellisation', 'etoiles'::name);
select has_function('labellisation_parcours');

truncate action_statut;


create or replace function
    score_gen(
    fait action_id[],
    programme action_id[]
)
    returns table
            (
                concerne                       boolean,
                action_id                      action_id,
                desactive                      boolean,
                referentiel                    referentiel,
                point_fait                     float,
                point_pas_fait                 float,
                point_potentiel                float,
                point_programme                float,
                point_referentiel              float,
                total_taches_count             float,
                point_non_renseigne            float,
                point_potentiel_perso          float,
                completed_taches_count         float,
                fait_taches_avancement         float,
                pas_fait_taches_avancement     float,
                programme_taches_avancement    float,
                pas_concerne_taches_avancement float
            )
as
$$
select true  as concerne,
       ar.action_id,
       false as desactive,
       ar.referentiel,
       1     as point_fait,
       1     as point_pas_fait,
       1     as point_potentiel,
       1     as point_programme,
       1     as point_referentiel,
       1     as total_taches_count,
       1     as point_non_renseigne,
       1     as point_potentiel_perso,
       1     as completed_taches_count,
       1     as fait_taches_avancement,
       1     as pas_fait_taches_avancement,
       1     as programme_taches_avancement,
       1     as pas_concerne_taches_avancement
from action_definition ar
$$ language sql;
comment on function score_gen is
    '';


-- insert faked client scores, sort of.
truncate client_scores;
insert into client_scores
select 1,
       ar.referentiel,
       jsonb_agg(jsonb_build_object(
               'concerne', true,
               'action_id', ar.action_id,
               'desactive', false,
               'point_fait', 2,
               'referentiel', ar.referentiel,
               'point_pas_fait', 0.0,
               'point_potentiel', 2,
               'point_programme', 0.0,
               'point_referentiel', 2,
               'total_taches_count', 1,
               'point_non_renseigne', 0,
               'point_potentiel_perso', null,
               'completed_taches_count', 1,
               'fait_taches_avancement', 1,
               'pas_fait_taches_avancement', 0,
               'programme_taches_avancement', 0,
               'pas_concerne_taches_avancement', 0
           )),
       now()
from action_definition ar
group by ar.referentiel;


select ok((select score_fait = 100
                      and score_programme = 0
                      and completude = 1
                      and complet
           from labellisation.referentiel_score(1)
           where referentiel = 'eci'),
          'Labellisation scores function should output correct scores and completude for test data.');

select ok((select etoile_labellise = '1'
                      and prochaine_etoile_labellisation = '2'
                      and etoile_score_possible = '5'
                      and etoile_objectif = '5'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function should output correct state for test data.');

select ok((select etoiles = '5'
                      and completude_ok
                      and rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for test data.');

rollback;

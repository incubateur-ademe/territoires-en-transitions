begin;
select plan(6);

truncate action_statut;

-----------------
-- Critère 1.1 --
-----------------
select ok((select labellisation.critere_1_1(1, 'cae') = false),
          'La collectivité 1 n''a pas renseigné tout les statuts cae');

-- insert tout les statuts cae
insert into action_statut
select 1, id, 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from action_relation
where referentiel = 'cae';

select ok((select labellisation.critere_1_1(1, 'cae')),
          'La collectivité 1 a renseigné tout les statuts cae');

select ok((select labellisation.critere_1_1(1, 'eci') = false),
          'La collectivité 1 n''a pas renseigné tout les statuts eci');

-- insert tout les statuts eci
insert into action_statut
select 1, id, 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from action_relation
where referentiel = 'eci';

select ok((select labellisation.critere_1_1(1, 'eci')),
          'La collectivité 1 a renseigné tout les statuts eci');

-- insert faked client scores, sort of.
truncate client_scores;
insert into client_scores
select 1,
       ar.referentiel,
       jsonb_agg(jsonb_build_object(
               'action_id', ar.action_id,
               'referentiel', ar.referentiel,
               'point_fait', 10,
               'point_programme', .0,
               'point_potentiel', 10,
               'point_referentiel', 10,
               'completed_taches_count', 1,
               'total_taches_count', 1
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

rollback;

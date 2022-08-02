begin;
select plan(35);

select has_function('labellisation', 'referentiel_score'::name);
select has_function('labellisation', 'etoiles'::name);
select has_function('labellisation_parcours');

select has_function('test', 'generate_scores'::name);
select has_function('test_write_scores');
select has_function('test_fulfill');


-- alter preuve so we can insert fake data without messing with storage.
alter table labellisation_preuve_fichier
    drop constraint labellisation_preuve_fichier_file_id_fkey;

-- truncate data
truncate action_statut;
truncate client_scores;
truncate labellisation;
truncate labellisation.demande, labellisation_preuve_fichier;

-----------------------------------
------- Test base functions -------
-----------------------------------
-- Set pas_fait statut on all requirements.
insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
select 1, lac.action_id, 'pas_fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from labellisation_action_critere lac
on conflict do nothing;

-- Set every requirement at .0.
truncate private.action_score; --- use action_score as a temp table

-- all scores at 0
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel)
select ar.referentiel, ar.id, .0, .0, 10
from action_relation as ar;

select test_write_scores( 1,(select array_agg(s) from private.action_score s));

-- test base prérequis functions
select ok((select bool_and(ss.complete) and sum(ss.proportion_fait) = 0
           from private.action_score s
                    join private.score_summary_of(s) ss on true),
          'Score summaries should be not complete and have 0 points.');

truncate private.action_score; -- clean up temp table

select ok((select sum(score_fait) = 0 and bool_and(complet)
           from labellisation.referentiel_score(1)),
          'Referentiel scores should be at 0');

select ok((select bool_and(etoile_labellise is null and
                           etoile_objectif = '1')
           from labellisation.etoiles(1)),
          'Should be able to reach étoile #1');

select ok((select bool_and(atteint and etoile_objectif = '1')
           from labellisation.critere_score_global(1)),
          'Should be able to reach étoile #1 since required score is 0');

select ok((select not bool_and(atteint)
           from labellisation.critere_action(1)),
          'Should not be able to reach any criteres since all scores are at 0');


-----------------------------------------
------- Scenario: perfect scoring -------
-----------------------------------------
truncate labellisation;
truncate action_statut;
truncate client_scores;
truncate labellisation.demande, labellisation_preuve_fichier;

-- insert faked client scores, by default test_write_scores writes every score as fait.
select test_write_scores(1);

-- insert labellisation
insert into labellisation (collectivite_id, referentiel, obtenue_le, etoiles, score_realise, score_programme)
values (1, 'eci', now(), '1', .0, .0);

select ok((select score_fait = 1
                      and score_programme = 0
                      and completude = 1
                      and complet
           from labellisation.referentiel_score(1)
           where referentiel = 'eci'),
          'Labellisation scores function should output correct scores and completude for 100% fait test data.');

select ok((select etoile_labellise = '1'
                      and prochaine_etoile_labellisation = '2'
                      and etoile_score_possible = '5'
                      and etoile_objectif = '5'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function should output correct state for 100% fait test data.');

select ok((select etoiles = '5'
                      and completude_ok
                      and not rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for 100% fait test data but no demande.');

select ok((select preuve_nombre = 0
                      and not atteint
           from labellisation.critere_fichier(1)
           where referentiel = 'eci'),
          'Labellisation critere fichier function should output correct state when no file have been inserted.');

-- Create demande
insert into labellisation.demande (id, collectivite_id, referentiel, etoiles)
values (100, 1, 'eci', '5');

-- Mock file insertion
truncate labellisation_preuve_fichier;
insert into labellisation_preuve_fichier (collectivite_id, demande_id, file_id)
values (1, 100, gen_random_uuid());


select ok((select preuve_nombre = 1
                      and atteint
           from labellisation.critere_fichier(1)
           where referentiel = 'eci'),
          'Labellisation critere fichier function should output correct state when a file have been inserted.');


select ok((select etoiles = '5'
                      and completude_ok
                      and rempli
                      and calendrier is not null
                      and derniere_demande is not null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for 100% fait test data with demande fichier.');


------------------------------------------------------
------- Scenario: nothing is done nor complete -------
------------------------------------------------------
truncate labellisation;
truncate labellisation.demande, labellisation_preuve_fichier;

-- pas_fait statut on all requirements
truncate action_statut;
insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
select 1, lac.action_id, 'pas_fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from labellisation_action_critere lac
on conflict do nothing;

-- fake scoring, score and completion at 0
truncate private.action_score; -- use action_score as a temp table

-- zero the required actions scores
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                                  completed_taches_count, total_taches_count)
select lac.referentiel, lac.action_id, 0.0, 0.0, 10, 0, 4
from labellisation_action_critere lac;

-- zero the referentiel roots.
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                                  completed_taches_count, total_taches_count)
values ('eci', 'eci', .0, .0, 10, 0, 4),
       ('cae', 'cae', .0, .0, 10, 0, 4);

select test_write_scores( 1,(select array_agg(s) from private.action_score s));

truncate private.action_score; -- clean up

-- tests
select ok((select bool_and(score_fait = 0
    and score_programme = 0
    and completude = 0
    and not complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function should output correct scores and completude for 0%, not complete.');


select ok((select etoile_labellise is null
                      and prochaine_etoile_labellisation is null
                      and etoile_score_possible = '1'
                      and etoile_objectif = '1'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function should output correct state for 0% fait, not complete.');

select ok((select etoiles = '1'
                      and not completude_ok
                      and not rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for 0% fait, not complete, no demande.');


--------------------------------------------------------------------
------- Scenario: nothing is done but everything is complete -------
--------------------------------------------------------------------

truncate labellisation;
truncate labellisation.demande, labellisation_preuve_fichier;

-- fake scoring, score and completion at 1
truncate private.action_score; -- use action_score as a temp table
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                                  completed_taches_count, total_taches_count)
select lac.referentiel, lac.action_id, 0.0, 0.0, 10, 4, 4
from labellisation_action_critere lac;

insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                                  completed_taches_count, total_taches_count)
values ('eci', 'eci', .0, .0, 10, 4, 4),
       ('cae', 'cae', .0, .0, 10, 4, 4);

select test_write_scores( 1,(select array_agg(s) from private.action_score s));


-- tests
select ok((select bool_and(ss.complete) and sum(ss.proportion_fait) = 0
           from private.action_score s
                    join private.score_summary_of(s) ss on true),
          'Score summaries should be complete and have 0 points.');

truncate private.action_score; -- clean up temp table

select ok((select bool_and(score_fait = 0
    and score_programme = 0
    and completude = 1
    and complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function should output correct scores and completude for 0% fait, but complete.');


select ok((select etoile_labellise is null
                      and prochaine_etoile_labellisation is null
                      and etoile_score_possible = '1'
                      and etoile_objectif = '1'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function should output correct state for 0% fait, but complete.');


select ok((select etoiles = '1'
                      and completude_ok
                      and not rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for 0% fait, complete, no demande.');



------------------------------------------------------------
------- Scenario: requirements for étoile 1 are done -------
------------------------------------------------------------

-- fake scoring, score and completion at 1
select test_fulfill(1, '1');


select ok((select bool_and(score_fait = 0
    and score_programme = 0
    and completude = 1
    and complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function with etoile 1 requirements');

select ok((select etoile_labellise is null
                      and prochaine_etoile_labellisation is null
                      and etoile_score_possible = '1'
                      and etoile_objectif = '1'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function should output correct state for 100% requirements fait.');

select ok((select etoiles = '1'
                      and completude_ok
                      and not rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for 0% fait, complete, no demande.');

-- Create demande
truncate labellisation.demande, labellisation_preuve_fichier;
insert into labellisation.demande (id, collectivite_id, referentiel, etoiles)
values (100, 1, 'eci', '1');

-- Mock file insertion
insert into labellisation_preuve_fichier (collectivite_id, demande_id, file_id)
values (1, 100, gen_random_uuid());

select ok((select preuve_nombre = 1
                      and atteint
           from labellisation.critere_fichier(1)
           where referentiel = 'eci'),
          'Labellisation critere fichier function should output correct state when a file have been inserted.');

select ok((select etoiles = '1'
                      and completude_ok
                      and rempli
                      and calendrier is not null
                      and derniere_demande is not null -- actually current demande
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for 0% fait, complete, no demande.');


-----------------------------------------------------------------
------- Scenario: score requirement for étoile 2 are done -------
-----------------------------------------------------------------
select test_fulfill(1, '2');

select ok((select bool_and(score_fait = 0.35
    and score_programme = 0
    and completude = 1
    and complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function with etoile 2 fulfilled requirements');

select ok((select etoile_labellise is null
                      and prochaine_etoile_labellisation is null
                      and etoile_score_possible = '2'
                      and etoile_objectif = '2'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function with etoile 2 fulfilled requirements.');

select ok((select etoiles = '2'
                      and completude_ok
                      and rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function with etoile 2 fulfilled requirements.');


-----------------------------------------------------------------
------- Scenario: score requirement for étoile 3 are done -------
-----------------------------------------------------------------
select test_fulfill(1, '3');

select ok((select bool_and(score_fait = .50
    and score_programme = 0
    and completude = 1
    and complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function with etoile 3 requirements');

select ok((select etoile_labellise is null
                      and prochaine_etoile_labellisation is null
                      and etoile_score_possible = '3'
                      and etoile_objectif = '3'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function with etoile 3 requirements.');

select ok((select etoiles = '3'
                      and completude_ok
                      and rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function with etoile 3 requirements.');

rollback;

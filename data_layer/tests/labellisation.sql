begin;
select plan(17);

select has_function('labellisation', 'referentiel_score'::name);
select has_function('labellisation', 'etoiles'::name);
select has_function('labellisation_parcours');


-- alter preuve so we can insert fake data without messing with storage.
alter table labellisation_preuve_fichier
    drop constraint labellisation_preuve_fichier_file_id_fkey;

create or replace function
    score_gen(
    scores private.action_score[] default '{}'::private.action_score[],
    total_points float default 1000.0
)
    returns setof private.action_score
as
$$
with fake_ref as (with axes as (select ar.referentiel,
                                       count(*) as count
                                from action_children ac
                                         join action_relation ar on ar.id = ac.id
                                where depth = 1
                                group by ar.referentiel)
                  select ac.id,
                         ar.referentiel,
                         coalesce(array_length(ac.children, 1), 0)                as children_count,
                         (axes.count * total_points) /
                         sum(array_length(ac.children, 1)) over (order by depth ) as points
                  from action_children ac
                           join action_relation ar on ar.id = ac.id
                           join axes on axes.referentiel = ar.referentiel),
     s as (select *
           from unnest(scores))
select fr.referentiel,
       fr.id,
       coalesce(s.concerne, true),
       coalesce(s.desactive, false),
       coalesce(s.point_fait, fr.points),
       coalesce(s.point_pas_fait, 0.0),
       coalesce(s.point_potentiel, fr.points),
       coalesce(s.point_programme, 0.0),
       coalesce(s.point_referentiel, fr.points),
       coalesce(s.total_taches_count, fr.children_count),
       coalesce(s.point_non_renseigne, 0.0),
       coalesce(s.point_potentiel_perso, fr.points),
       coalesce(s.completed_taches_count, fr.children_count),
       coalesce(s.fait_taches_avancement, fr.children_count),
       coalesce(s.pas_fait_taches_avancement, 0.0),
       coalesce(s.programme_taches_avancement, 0.0),
       coalesce(s.pas_concerne_taches_avancement, 0.0)
from fake_ref fr
         left join s on s.action_id = fr.id
$$ language sql;
comment on function score_gen is
    'Interpole de faux scores *fait* par default, avec des scores optionnels donnés '
        'afin de tester les critères labellisation en fonction de scores. '
        'Attention les scores ne sont pas sommés.';

-- generate some scores
with current_scores as (select array_agg(s) as scores
                        from private.convert_client_scores((select cs.scores from client_scores cs limit 1)) s)
select g.*
into generated_scores
from current_scores
         join score_gen(current_scores.scores::private.action_score[]) g on true;

-- test generated scores
select is_empty('select action_id from generated_scores except select id from action_relation;',
                'Every action should have a generated score');


------------------------------
------- Base functions -------
------------------------------
truncate action_statut;
truncate client_scores;
truncate labellisation;
truncate labellisation_demande, labellisation_preuve_fichier;

-- pas_fait statut on all requirements
insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
select 1, lac.action_id, 'pas_fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from labellisation_action_critere lac
on conflict do nothing;
-- fake scoring, every requirement at .0
truncate private.action_score; -- use action_score as a temp table
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel)
select lac.referentiel, lac.action_id, 0.0, 0.0, 10
from labellisation_action_critere lac;
-- roots at .0
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel)
values ('eci', 'eci', .0, .0, 10),
       ('cae', 'cae', .0, .0, 10);

-- make client_scores
insert into client_scores
select 1,
       s.referentiel,
       jsonb_agg(s),
       now()
from score_gen((select array_agg(s) from private.action_score s)) s
group by s.referentiel;

-- create summaries
select ss.*
into test_summaries
from private.action_score s
         join private.score_summary_of(s) ss on true;

select ok((select sum(proportion_fait) = .0 from test_summaries),
          'Summaries fait total should be equal to 0');

select is_empty('select action_id from private.action_score except select action_id from test_summaries;',
                'Every score should have a summary');

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
truncate labellisation_demande, labellisation_preuve_fichier;

-- insert faked client scores.
insert into client_scores
select 1,
       s.referentiel,
       jsonb_agg(s),
       now()
from score_gen(null) s
group by s.referentiel;

-- insert labellisation
insert into labellisation (collectivite_id, referentiel, obtenue_le, etoiles, score_realise, score_programme)
values (1, 'eci', now(), '1', .0, .0);


select ok((select score_fait = 100
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
insert into labellisation_demande (id, collectivite_id, referentiel, etoiles)
values (100, 1, 'eci', '5');

-- Mock file insertion
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

-----------------------------------------------
------- Scenario: score on requirements -------
-----------------------------------------------
truncate action_statut;
truncate client_scores;
truncate labellisation;
truncate labellisation_demande, labellisation_preuve_fichier;

-- pas_fait statut on all requirements
insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
select 1, lac.action_id, 'pas_fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from labellisation_action_critere lac
on conflict do nothing;

-- fake scoring, every requirement at .0
truncate private.action_score; -- use action_score as a temp table
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel)
select lac.referentiel, lac.action_id, 0.0, 0.0, 10
from labellisation_action_critere lac;

insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel)
values ('eci', 'eci', .0, .0, 10);

insert into client_scores
select 1,
       s.referentiel,
       jsonb_agg(s),
       now()
from score_gen((select array_agg(s) from private.action_score s)) s
group by s.referentiel;


select ok((select not bool_or(atteint)
           from labellisation.critere_action(1)),
          'Labellisation critère should return no critères atteints.');


-- insert fait statut on requirements for étoile 1 only
insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
select 1, lac.action_id, 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from labellisation_action_critere lac
where etoile = '1'
group by lac.action_id
on conflict (collectivite_id, action_id) do update set avancement = excluded.avancement;

-- replace scores
truncate client_scores;
truncate private.action_score;

insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel)
select lac.referentiel, lac.action_id, 10, 0.0, 10
from labellisation_action_critere lac
where lac.etoile = '1';

insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel)
select lac.referentiel, lac.action_id, 0.0, 0.0, 10
from labellisation_action_critere lac
where lac.etoile != '1';

insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel)
values ('eci', 'eci', .0, .0, 10);

-- todo

rollback;

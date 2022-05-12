begin;
select plan(35);

select has_function('labellisation', 'referentiel_score'::name);
select has_function('labellisation', 'etoiles'::name);
select has_function('labellisation_parcours');


-- alter preuve so we can insert fake data without messing with storage.
alter table labellisation_preuve_fichier
    drop constraint labellisation_preuve_fichier_file_id_fkey;


------------------------------
------- Generate scores  -----
------------------------------
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

-------------------------------------------
------- Fulfill minimum requirements  -----
-------------------------------------------
select action_id,
       referentiel,
       etoile,
       -- null is the maximum value, as programme < fait - we prefer a null programme
       case
           when null_programme.yes then null
           else max(min_programme_percentage) end as min_programme_percentage,
       max(min_realise_percentage)                as min_realise_percentage
into min_requirements
from labellisation_action_critere lac
         -- for every requirement we check if there is a null
         join lateral (select ll.min_programme_percentage is null as yes
                       from labellisation_action_critere ll
                       where ll.action_id = lac.action_id
                       order by min_programme_percentage nulls first
                       limit 1 ) null_programme on true
group by action_id, referentiel, etoile, null_programme.yes;


create or replace function
    fulfill(
    etoile labellisation.etoile
)
    returns void
as
$$
truncate private.action_score; -- use action_score as a temp table

-- required actions scores
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                                  completed_taches_count, total_taches_count)
select mr.referentiel,
       mr.action_id,
       -- take the bare minimum programme or realise.
       case
           when mr.min_programme_percentage is not null then .0
           else mr.min_realise_percentage
           end,
       coalesce(mr.min_programme_percentage, .0),
       --
       1,
       4,
       4
from min_requirements mr
where mr.etoile = fulfill.etoile;

-- root actions scores
with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
insert
into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                           completed_taches_count, total_taches_count)
select ref.referentiel, ref.referentiel::action_id, em.min_realise_percentage, .0, 100, 4, 4
from ref
         join labellisation.etoile_meta em on em.etoile = fulfill.etoile;

-- insert client scores
truncate client_scores;
insert into client_scores
select 1,
       s.referentiel,
       jsonb_agg(s),
       now()
from score_gen((select array_agg(s) from private.action_score s)) s
group by s.referentiel;

$$ language sql;
comment on function fulfill is
    'Insert fake scores that fulfill but do not exceed the requirements for a given étoile.';

-----------------------------------
------- Test base functions -------
-----------------------------------
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
insert into labellisation_demande (id, collectivite_id, referentiel, etoiles)
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
truncate labellisation_demande, labellisation_preuve_fichier;

-- pas_fait statut on all requirements
truncate action_statut;
insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by)
select 1, lac.action_id, 'pas_fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from labellisation_action_critere lac
on conflict do nothing;

-- fake scoring, score and completion at 0
truncate private.action_score; -- use action_score as a temp table
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                                  completed_taches_count, total_taches_count)
select lac.referentiel, lac.action_id, 0.0, 0.0, 10, 0, 4
from labellisation_action_critere lac;

insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                                  completed_taches_count, total_taches_count)
values ('eci', 'eci', .0, .0, 10, 0, 4),
       ('cae', 'cae', .0, .0, 10, 0, 4);

-- client scores from fake scoring
truncate client_scores;
insert into client_scores
select 1,
       s.referentiel,
       jsonb_agg(s),
       now()
from score_gen((select array_agg(s) from private.action_score s)) s
group by s.referentiel;


select ok((select not bool_and(ss.complete) and sum(ss.proportion_fait) = 0
           from private.action_score s
                    join private.score_summary_of(s) ss on true),
          'Score summaries should be not complete and have 0 points.');


select ok((select bool_and(score_fait = 0
    and score_programme = 0
    and completude = 0
    and not complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function should output correct scores and completude for 0%, not complete.');


select ok((select etoile_labellise is null
                      and prochaine_etoile_labellisation is null
                      and etoile_score_possible is null
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
truncate labellisation_demande, labellisation_preuve_fichier;

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

-- client scores from fake scoring
truncate client_scores;
insert into client_scores
select 1,
       s.referentiel,
       jsonb_agg(s),
       now()
from score_gen((select array_agg(s) from private.action_score s)) s
group by s.referentiel;

select ok((select bool_and(ss.complete) and sum(ss.proportion_fait) = 0
           from private.action_score s
                    join private.score_summary_of(s) ss on true),
          'Score summaries should be complete and have 0 points.');


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
select *
from fulfill('1');
-- select * from private.action_score s  join private.score_summary_of(s) ss on true;
-- select * from labellisation.referentiel_score(1);

select ok((select bool_and(score_fait = 0
    and score_programme = 0
    and completude = 1
    and complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function should output correct scores and completude for 100% requirements fait');

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
truncate labellisation_demande, labellisation_preuve_fichier;
insert into labellisation_demande (id, collectivite_id, referentiel, etoiles)
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
select *
from fulfill('2');

select ok((select bool_and(score_fait = 35
    and score_programme = 0
    and completude = 1
    and complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function should output correct scores and completude for 100% requirements fait');

select ok((select etoile_labellise is null
                      and prochaine_etoile_labellisation is null
                      and etoile_score_possible = '2'
                      and etoile_objectif = '2'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function should output correct state for 100% requirements fait.');

select ok((select etoiles = '2'
                      and completude_ok
                      and rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for 0% fait, complete, no demande.');


-----------------------------------------------------------------
------- Scenario: score requirement for étoile 3 are done -------
-----------------------------------------------------------------
select *
from fulfill('3');

select ok((select bool_and(score_fait = .5
    and score_programme = 0
    and completude = 1
    and complet)
           from labellisation.referentiel_score(1)),
          'Labellisation scores function should output correct scores and completude for 100% requirements fait');

select ok((select etoile_labellise is null
                      and prochaine_etoile_labellisation is null
                      and etoile_score_possible = '3'
                      and etoile_objectif = '3'
           from labellisation.etoiles(1)
           where referentiel = 'eci'),
          'Labellisation étoiles function should output correct state for 100% requirements fait.');

select ok((select etoiles = '3'
                      and completude_ok
                      and rempli
                      and calendrier is not null
                      and derniere_demande is null
           from labellisation_parcours(1)
           where referentiel = 'eci'),
          'Labellisation parcours function should output correct state for 0% fait, complete, no demande.');

rollback;

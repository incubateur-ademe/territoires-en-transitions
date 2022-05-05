begin;
select plan(9);

select has_function('labellisation', 'referentiel_score'::name);
select has_function('labellisation', 'etoiles'::name);
select has_function('labellisation_parcours');

truncate action_statut;
truncate client_scores;
truncate labellisation_demande, labellisation_preuve_fichier;

-- alter preuve so we can insert fake data without messing with storage.
alter table labellisation_preuve_fichier
    drop constraint labellisation_preuve_fichier_file_id_fkey;

-- score generation helper.
create or replace function
    score_gen(statuts action_statut[])
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
-- fake referentiels worth 1000 points each, equally weighted amongst children.
with fake_ref as (with axes as (select ar.referentiel,
                                       count(*) as count
                                from action_children ac
                                         join action_relation ar on ar.id = ac.id
                                where depth = 1
                                group by ar.referentiel)
                  select ac.id,
                         ar.referentiel,
                         coalesce(array_length(ac.children, 1), 0)                                      as children_count,
                         (axes.count * 1000) / sum(array_length(ac.children, 1)) over (order by depth ) as points
                  from action_children ac
                           join action_relation ar on ar.id = ac.id
                           join axes on axes.referentiel = ar.referentiel),
     s as (select *
           from unnest(score_gen.statuts))
select true                                                                               as concerne,
       fr.id,
       false                                                                              as desactive,
       fr.referentiel,
       case when s.avancement = 'fait' or s.avancement is null then fr.points else .0 end as point_fait,
       case when s.avancement = 'pas_fait' then fr.points else .0 end                     as point_pas_fait,
       fr.points                                                                          as point_potentiel,
       case when s.avancement = 'programme' then fr.points else .0 end                    as point_programme,
       fr.points                                                                          as point_referentiel,
       children_count                                                                     as total_taches_count,
       0                                                                                  as point_non_renseigne,
       fr.points                                                                          as point_potentiel_perso,
       children_count                                                                     as completed_taches_count,
       case
           when s.avancement = 'fait' or s.avancement is null then children_count
           else .0 end                                                                    as fait_taches_avancement,
       case when s.avancement = 'pas_fait' then children_count else .0 end                as pas_fait_taches_avancement,
       case when s.avancement = 'programme' then children_count else .0 end               as programme_taches_avancement,
       0                                                                                  as pas_concerne_taches_avancement
from fake_ref fr
         left join s on s.action_id = fr.id
$$ language sql;
comment on function score_gen is
    'Génère des faux scores fait par default pour tester les critères labellisation en fonction de statuts. '
        'Attention les scores ne sont pas sommés, les statuts n''ont d''effets que sur les actions directement concernées.';


-- insert faked client scores.
insert into client_scores
select 1,
       s.referentiel,
       jsonb_agg(s),
       now()
from score_gen(null) s
group by s.referentiel;


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


rollback;

begin;
select plan(9);

-- Enlève le trigger pour tester le debounce - sinon les modified_at sont toujours égaux à now().
drop trigger if exists set_modified_at_action_statut_update on action_statut;

-- Les séquences des statuts à sauvegarder.
create table test.sequence_statut
(
    action_id           action_id,
    avancement          avancement,
    concerne            bool      default true,
    avancement_detaille numeric[] default null,
    modified_at         timestamptz
);

-- Fonction utilitaire pour upsert un statut.
create function
    test.upsert_statut(
    collectivite_id integer,
    seq test.sequence_statut
) returns void
as
$$
insert into action_statut(collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_at)
values (upsert_statut.collectivite_id, seq.action_id, seq.avancement,
        seq.avancement_detaille, seq.concerne,
        seq.modified_at)
on conflict (collectivite_id, action_id)
    do update set avancement          = excluded.avancement,
                  avancement_detaille = excluded.avancement_detaille,
                  modified_by         = excluded.modified_by,
                  modified_at         = excluded.modified_at;
$$ language sql;



-- Supprime les données avant un scénario.
create function
    test.clear()
    returns void
as
$$
truncate test.sequence_statut;
truncate action_statut;
select test_clear_history();
$$ language sql;


-- Scénario Yolo mets à jour un statut
select test.clear();
select test.identify_as('yolo@dodo.com');

--- On définit la séquence
insert into test.sequence_statut (action_id, avancement, modified_at)
values -- un jour à quelques minutes d'intervalle
       ('cae_1.1.1.1.1', 'pas_fait', '2022-09-10 06:02 +0'),
       ('cae_1.1.1.1.1', 'non_renseigne', '2022-09-10 06:03 +0'),
       ('cae_1.1.1.1.1', 'programme', '2022-09-10 06:04 +0'),
       -- puis le lendemain
       ('cae_1.1.1.1.1', 'fait', '2022-09-11 08:00 +0');

--- On joue la séquence
select test.upsert_statut(1, seq)
from test.sequence_statut seq;

--- On vérifie l'état.
select results_eq(
           -- les statuts
               'select action_id, avancement, concerne, avancement_detaille, modified_by, modified_at from action_statut;',
           -- le statut le plus récent de la séquence
               'select action_id, avancement, concerne, avancement_detaille, auth.uid(), modified_at from test.sequence_statut order by modified_at desc limit 1;',
               'Les statuts devraient contenir uniquement le statut le plus récent de la séquence.'
           );

select bag_eq(
           -- l'historique des statuts
               'select action_id, avancement, concerne, avancement_detaille, modified_by, modified_at from historique.action_statut;',
           -- les statuts de la séquence
               'select action_id, avancement, concerne, avancement_detaille, auth.uid(), modified_at from test.sequence_statut order by modified_at desc limit 2;',
               'L''historique devrait contenir uniquement les deux statuts les plus récents de la séquence.'
           );

select bag_eq(
           -- l'historique des statuts
               'select collectivite_id,
                      action_id,
                      avancement,
                      coalesce(previous_avancement, ''non_renseigne'') as previous_avancement,
                      avancement_detaille,
                      previous_avancement_detaille,
                      concerne,
                      previous_concerne,
                      modified_by,
                      previous_modified_by,
                      modified_at,
                      previous_modified_at
               from historique.action_statut;',
           -- la vue historique utilisée par le client.
               'select collectivite_id,
                      action_id,
                      avancement,
                      previous_avancement,
                      avancement_detaille,
                      previous_avancement_detaille,
                      concerne,
                      previous_concerne,
                      modified_by_id,
                      previous_modified_by_id,
                      modified_at,
                      previous_modified_at
               from historique;',
               'La vue historique globale devrait avoir touts les données de l''historique des statuts'
           );


-- Scénario Yolo puis Yili mettent à jour des statuts
select test.clear();

--- On définit la séquence
insert into test.sequence_statut (action_id, avancement, modified_at)
values -- un jour à quelques minutes d'intervalle
       ('cae_1.1.1.1.1', 'pas_fait', '2022-09-10 06:02 +0'),
       ('cae_1.1.1.1.1', 'non_renseigne', '2022-09-10 06:03 +0'),
       ('cae_1.1.1.1.1', 'programme', '2022-09-10 06:04 +0'),
       ('cae_1.1.1.1.1', 'fait', '2022-09-10 06:05 +0');

-- Yolo réponds deux fois.
select test.identify_as('yolo@dodo.com');
select test.upsert_statut(1, seq)
from test.sequence_statut seq
-- les deux premières lignes
limit 2;

-- Puis Yili réponds deux fois.
select test.identify_as('yili@didi.com');
select test.upsert_statut(1, seq)
from test.sequence_statut seq
-- les deux dernières lignes
limit 2 offset 2;

-- On vérifie les résultats.
select ok((select count(*) = 1 from action_statut), 'Il devrait y avoir un seul statut.');
select ok((select count(*) = 2 from historique.action_statut), 'Il devrait y avoir deux statuts historisés.');
select isnt((select modified_by from historique.action_statut limit 1),
            (select modified_by from historique.action_statut limit 1 offset 1),
            'Les deux statuts historisés devraient avoir des `modified_by` différents.');
select is((select array_agg(modified_by_nom) from historique),
          (select array ['Yili Didi', 'Yolo Dodo']),
          'La vue client devrait lister une modification par Yili suivie d''une par Yolo');


-- Scénario Yolo modifie des statuts d'actions différentes.
select test.clear();

--- On définit la séquence
insert into test.sequence_statut (action_id, avancement, modified_at)
values -- un jour à quelques minutes d'intervalle
       ('cae_1.1.1.1.1', 'pas_fait', '2022-09-10 06:02 +0'),
       ('cae_1.1.1.2.1', 'non_renseigne', '2022-09-10 06:03 +0'),
       ('cae_1.1.1.3.1', 'programme', '2022-09-10 06:04 +0');

--- On joue la séquence.
select test.identify_as('yolo@dodo.com');
select test.upsert_statut(1, seq)
from test.sequence_statut seq;

select bag_eq(
           -- l'historique des statuts
               'select action_id, avancement, concerne, avancement_detaille, modified_by, modified_at from historique.action_statut;',
           -- tous les statuts de la séquence
               'select action_id, avancement, concerne, avancement_detaille, auth.uid(), modified_at from test.sequence_statut;',
               'L''historique devrait contenir tous les statuts de la séquence.'
           );


-- Scénario Yolo modifie des statuts en avancement détaillé.
select test.clear();

--- On définit la séquence
insert into test.sequence_statut (action_id, avancement, avancement_detaille, modified_at)
values -- à un jour d'intervalle
       ('cae_1.1.1.1.1', 'pas_fait', null, '2022-09-10 06:02 +0'),
       ('cae_1.1.1.1.1', 'programme', null, '2022-09-11 06:02 +0'),
       ('cae_1.1.1.1.1', 'detaille', array [.2, .8,.0], '2022-09-12 06:03 +0'),
       ('cae_1.1.1.1.1', 'detaille', array [.1, .7,.2], '2022-09-13 06:04 +0');

--- On joue la séquence.
select test.identify_as('yolo@dodo.com');
select test.upsert_statut(1, seq)
from test.sequence_statut seq;

select bag_eq(
               'select previous_avancement,
                       avancement,
                       previous_avancement_detaille,
                       avancement_detaille,
                       previous_modified_by,
                       modified_by,
                       modified_at
                from historique.action_statut;',
               'select lag(avancement) over w          as previous_avancement,
                       avancement,
                       lag(avancement_detaille) over w as previous_avancement_detaille,
                       avancement_detaille,
                       lag(modified_by) over w         as previous_modified_by,
                       modified_by,
                       modified_at
                from historique.action_statut
                    window w as (order by modified_at rows between 1 preceding and current row)
                order by modified_at desc;',
               'La vue historique devrait être égale à la query fenêtrée sur les statuts historisés.'
           );

rollback;

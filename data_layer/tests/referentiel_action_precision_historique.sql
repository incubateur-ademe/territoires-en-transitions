begin;
select plan(9);

-- Enlève le trigger pour tester le debounce - sinon les modified_at sont toujours égaux à now().
drop trigger if exists set_modified_at_before_action_commentaire_update on action_commentaire;

-- Les séquences des precisions (commentaires) à sauvegarder.
create table test.sequence_precision
(
    action_id   action_id,
    commentaire text,
    modified_at timestamptz
);

-- Fonction utilitaire pour upsert une précision (commentaire).
create function
    test.upsert_precision(
    collectivite_id integer,
    seq test.sequence_precision
) returns void
as
$$
insert into action_commentaire(collectivite_id, action_id, commentaire, modified_at)
values (upsert_precision.collectivite_id, seq.action_id, seq.commentaire, seq.modified_at)
on conflict (collectivite_id, action_id)
    do update set commentaire = excluded.commentaire,
                  modified_by = excluded.modified_by,
                  modified_at = excluded.modified_at;
$$ language sql;

-- Supprime les données avant un scénario.
create function
    test.clear()
    returns void
as
$$
truncate test.sequence_precision;
truncate action_commentaire;
select test_clear_history();
$$ language sql;

-- Scénario Yolo mets à jour les précisions action
select test.clear();

--- On définit la séquence
insert into test.sequence_precision (action_id, commentaire, modified_at)
values -- un jour à quelques minutes d'intervalle
       ('cae_1.1.1.1.1', 'hel', '2022-09-10 06:02 +0'),
       ('cae_1.1.1.1.1', 'hello', '2022-09-10 06:03 +0'),
       ('cae_1.1.1.1.1', 'hello world', '2022-09-10 06:04 +0'),
       -- puis le lendemain
       ('cae_1.1.1.1.1', 'Bonjour', '2022-09-11 08:00 +0');


--- On joue la séquence
select test.identify_as('yolo@dodo.com');
select test.upsert_precision(1, seq)
from test.sequence_precision seq;


--- On vérifie l'état.
select results_eq(
           -- les precisions
               'select action_id, commentaire, modified_by, modified_at from action_commentaire;',
           -- la précision la plus récente de la séquence
               'select action_id, commentaire, auth.uid(), modified_at from test.sequence_precision order by modified_at desc limit 1;',
               'Les precisions (commentaires) devraient contenir uniquement la précision la plus récente de la séquence.'
           );

select bag_eq(
               'select collectivite_id, action_id, precision, modified_by, modified_at from historique.action_precision;',
               'select 1, action_id, commentaire, auth.uid(), modified_at from test.sequence_precision order by modified_at desc limit 2;',
               'L''historique devrait contenir uniquement les deux commentaires les plus récents de la séquence.'
           );
select bag_eq(
           -- l'historique des précisions
               'select collectivite_id,
                       action_id,
                       precision,
                       previous_precision,
                       modified_by,
                       previous_modified_by,
                       modified_at,
                       previous_modified_at
                from historique.action_precision;',
           -- la vue historique utilisée par le client
               'select collectivite_id,
                       action_id,
                       precision,
                       previous_precision,
                       modified_by_id,
                       previous_modified_by_id,
                       modified_at,
                       previous_modified_at
                from historique where type = ''action_precision'';',
               'La vue historique globale devrait avoir touts les données de l''historique des précisions'
           );

-- Scénario Yolo puis Yili mettent à jour des commentaires.
select test.clear();

--- On définit la séquence
insert into test.sequence_precision (action_id, commentaire, modified_at)
values -- un jour à quelques minutes d'intervalle
       ('cae_1.1.1.1.1', 'hel', '2022-09-10 06:02 +0'),
       ('cae_1.1.1.1.1', 'hello', '2022-09-10 06:03 +0'),
       ('cae_1.1.1.1.1', 'hello world', '2022-09-10 06:04 +0'),
       ('cae_1.1.1.1.1', 'Bonjour', '2022-09-10 06:05 +0');


--- On joue les deux premiers éléments en tant que Yolo
select test.identify_as('yolo@dodo.com');
select test.upsert_precision(1, seq)
from test.sequence_precision seq
limit 2;

--- Puis on joue les deux derniers éléments en tant que Yili
select test.identify_as('yili@didi.com');
select test.upsert_precision(1, seq)
from test.sequence_precision seq
limit 2 offset 2;


-- On vérifie les résultats.
select ok((select count(*) = 1 from action_commentaire), 'Il devrait y avoir un seul statut.');
select ok((select count(*) = 2 from historique.action_precision), 'Il devrait y avoir deux statuts historisés.');
select isnt((select modified_by from historique.action_precision limit 1),
            (select modified_by from historique.action_precision limit 1 offset 1),
            'Les deux statuts historisés devraient avoir des `modified_by` différents.');
select is((select array_agg(modified_by_nom) from historique),
          (select array ['Yili Didi', 'Yolo Dodo']),
          'La vue client devrait lister une modification par Yili suivie d''une par Yolo');


-- Scénario Yolo modifie des précisions sur plusieurs jours.
select test.clear();

--- On définit la séquence
insert into test.sequence_precision (action_id, commentaire, modified_at)
values -- chaque jour pendant 4 jours
       ('cae_1.1.1.1.1', 'hello', '2022-09-01 06:02 +0'),
       ('cae_1.1.1.1.1', 'hola', '2022-09-02 06:03 +0'),
       ('cae_1.1.1.1.1', 'こんにちは', '2022-09-03 06:04 +0'),
       ('cae_1.1.1.1.1', 'bonjour', '2022-09-04 06:05 +0');


--- On joue la séquence.
select test.identify_as('yolo@dodo.com');
select test.upsert_precision(1, seq)
from test.sequence_precision seq;

select bag_eq(
               'select previous_precision,
                      precision,
                      previous_modified_by,
                      modified_by,
                      modified_at
               from historique.action_precision;',
               'select lag(precision) over w   as previous_precision,
                      precision,
                      lag(modified_by) over w as previous_modified_by,
                      modified_by,
                      modified_at
               from historique.action_precision
                   window w as (order by modified_at rows between 1 preceding and current row)
               order by modified_at desc;',
               'La vue historique devrait être égale à la query fenêtrée sur les statuts historisés.'
           );


-- Scénario Yolo modifie des précisions (commentaires) d'actions différentes.
select test.clear();

--- On définit la séquence
insert into test.sequence_precision (action_id, commentaire, modified_at)
values -- un jour à quelques minutes d'intervalle.
       ('cae_1.1.1.1.1', 'hello', '2022-09-01 06:02 +0'),
       ('cae_1.1.1.2.1', 'hola', '2022-09-01 06:03 +0'),
       ('cae_1.1.1.3.1', 'こんにちは', '2022-09-01 06:04 +0'),
       ('cae_1.1.1.4.1', 'bonjour', '2022-09-01 06:05 +0');

--- On joue la séquence.
select test.identify_as('yolo@dodo.com');
select test.upsert_precision(1, seq)
from test.sequence_precision seq;

select bag_eq(
           -- l'historique des statuts
               'select action_id, precision, modified_by, modified_at from historique.action_precision;',
           -- tous les statuts de la séquence
               'select action_id, commentaire, auth.uid(), modified_at from test.sequence_precision;',
               'L''historique devrait contenir tous les statuts de la séquence.'
           );

rollback;

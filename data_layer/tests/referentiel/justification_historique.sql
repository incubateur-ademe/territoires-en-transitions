begin;
select plan(6);
select test.disable_evaluation_api();

-- Enlève le trigger pour tester le debounce - sinon les modified_at sont toujours égaux à now().
drop trigger if exists modified_at on justification_ajustement;

-- Les séquences des justifications à sauvegarder.
create table test.sequence_statut
(
    action_id   action_id,
    texte       text,
    modified_at timestamptz
);

-- Fonction utilitaire pour upsert un statut.
create function
    test.upsert_statut(
    collectivite_id integer,
    seq test.sequence_statut
) returns void
as
$$
insert into justification_ajustement(collectivite_id, action_id, texte, modified_at)
values (upsert_statut.collectivite_id, seq.action_id, seq.texte, seq.modified_at)
on conflict (collectivite_id, action_id)
    do update set texte          = excluded.texte,
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
truncate justification_ajustement;
truncate historique.justification_ajustement;
select test_clear_history();
$$ language sql;


-- Scénario Yolo mets à jour un statut
select test.clear();
select test.identify_as('yolo@dodo.com');

--- On définit la séquence
insert into test.sequence_statut (action_id, texte, modified_at)
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
           -- les justifications
               'select action_id, texte, modified_by, modified_at from justification_ajustement;',
           -- le statut le plus récent de la séquence
               'select action_id, texte, auth.uid(), modified_at from test.sequence_statut order by modified_at desc limit 1;',
               'Les justifications devraient contenir uniquement le statut le plus récent de la séquence.'
           );

select bag_eq(
           -- l'historique des justifications
               'select action_id, texte, modified_by, modified_at from historique.justification_ajustement;',
           -- les justifications de la séquence
               'select action_id, texte, auth.uid(), modified_at from test.sequence_statut order by modified_at desc limit 2;',
               'L''historique devrait contenir uniquement les deux justifications les plus récents de la séquence.'
           );

-- Scénario Yolo puis Yili mettent à jour des justifications
select test.clear();

--- On définit la séquence
insert into test.sequence_statut (action_id, texte, modified_at)
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
select ok((select count(*) = 1 from justification_ajustement), 'Il devrait y avoir un seul statut.');
select ok((select count(*) = 2 from historique.justification_ajustement),
          'Il devrait y avoir deux justifications historisés.');
select isnt((select modified_by from historique.justification_ajustement limit 1),
            (select modified_by from historique.justification_ajustement limit 1 offset 1),
            'Les deux justifications historisés devraient avoir des `modified_by` différents.');


-- Scénario Yolo modifie des justifications d'actions différentes.
select test.clear();

--- On définit la séquence
insert into test.sequence_statut (action_id, texte, modified_at)
values -- un jour à quelques minutes d'intervalle
       ('cae_1.1.1.1.1', 'pas_fait', '2022-09-10 06:02 +0'),
       ('cae_1.1.1.2.1', 'non_renseigne', '2022-09-10 06:03 +0'),
       ('cae_1.1.1.3.1', 'programme', '2022-09-10 06:04 +0');

--- On joue la séquence.
select test.identify_as('yolo@dodo.com');
select test.upsert_statut(1, seq)
from test.sequence_statut seq;

select bag_eq(
           -- l'historique des justifications
               'select action_id, texte, modified_by, modified_at from historique.justification_ajustement;',
           -- toutes les justifications de la séquence
               'select action_id, texte, auth.uid(), modified_at from test.sequence_statut;',
               'L''historique devrait contenir toutes les justifications de la séquence.'
           );


rollback;

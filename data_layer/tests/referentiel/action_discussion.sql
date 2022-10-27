begin;
select plan(12);

truncate action_discussion cascade;

select test.identify_as('yolo@dodo.com');

-- Ajout de deux discussions pour les collectivites 23 et 24
insert into action_discussion(collectivite_id, action_id)
values
    (23, 'eci_2'),
    (24, 'eci_2')
;

-- Ajout de deux commentaires à la discussion de la collectivite 23
insert into action_discussion_commentaire (discussion_id, message)
values
    ((select id from action_discussion where collectivite_id=23 limit 1), '1'),
    ((select id from action_discussion where collectivite_id=23 limit 1), '2'),
    ((select id from action_discussion where collectivite_id=24 limit 1), '3');

-- Verification du nombre de discussions total
select ok(
    (select count(*) = 2 from action_discussion_feed),
    'Il devrait y avoir deux discussions.');

-- Verification du nombre de commentaires par discussion
select ok(
    (select cardinality(commentaires) = 2 from action_discussion_feed where collectivite_id = 23),
    'Il devrait y avoir deux commentaires dans la discussion de la collectivite 23.');
select ok(
    (select cardinality(commentaires) = 1 from action_discussion_feed where collectivite_id = 24),
    'Il devrait y avoir un commentaires dans la discussion de la collectivite 24.');

-- Verification de la fonction modified_by_nom
select ok(
    (select created_by_nom = 'Yolo Dodo' from action_discussion_feed limit 1),
    'La discussion devrait être créé par Yolo Dodo');

-- Verification upsert dans la vue avec création discussion
insert into action_discussion_feed(collectivite_id, action_id, commentaires)
-- ! Valeur de commentaires fausses à mettre que pour faire passer les tests sql
values (25, 'eci_2', '{"(0,17440546-f389-4d4f-bfdb-b0c94a1bd0f9,2022-10-26 12:15:11.271759 +00:00,0,ajoutparvue)"}');
select ok(
        (select count(*) = 3 from action_discussion_feed),
        'Il devrait y avoir trois discussions.');
select ok(
        (
            select message = 'ajoutparvue'
            from action_discussion_commentaire adc
            join action_discussion ad on ad.id = adc.discussion_id
            where ad.collectivite_id = 25
            limit 1
        ),
        'Il devrait y avoir le message ajoutparvue dans la discussion de la collectivite 25.');

-- Verification upsert dans la vue avec discussion déjà existante
insert into action_discussion_feed(id, commentaires, status)
values (
        (select id from action_discussion where collectivite_id = 25),
           -- ! Valeur de commentaires fausses à mettre que pour faire passer les tests sql
        '{"(0,17440546-f389-4d4f-bfdb-b0c94a1bd0f9,2022-10-26 12:15:11.271759 +00:00,0,reponseparvue)"}',
        'ouvert'
);
select ok(
        (select count(*) = 3 from action_discussion_feed),
        'Il devrait y toujours y avoir trois discussions.');
select ok(
         (select cardinality(commentaires) = 2 from action_discussion_feed where collectivite_id = 25),
        'Il devrait y avoir deux commentaires dans la discussion de la collectivite 25.');
-- Verification upsert dans la vue avec discussion déjà existante sans ajout de commentaire
insert into action_discussion_feed(id, commentaires, status)
values (
           (select id from action_discussion where collectivite_id = 25),
           '{}',
           'ferme'
       );
select ok(
               (select cardinality(commentaires) = 2 from action_discussion_feed where collectivite_id = 25),
               'Il devrait toujours y avoir deux commentaires dans la discussion de la collectivite 25.');
select ok(
        (select status = 'ferme' from action_discussion_feed where collectivite_id = 25),
        'Il devrait y avoir un status ferme dans la discussion de la collectivite 25.');

-- Verification trigger suppression discussion si dernier commentaire
delete from action_discussion_commentaire where message ='3';
select is_empty(
    'select * from action_discussion where collectivite_id = 24',
    'La discussion de la collectivite 24 devrait ne plus exister');
-- Verification trigger suppression discussion si reste commentaires
delete from action_discussion_commentaire where message = '2';
select isnt_empty(
               'select * from action_discussion where collectivite_id = 23',
               'La discussion de la collectivite 23 devrait toujours exister');
rollback;
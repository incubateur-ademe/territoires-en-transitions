begin;
select plan(5);

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
begin;
select plan(6);

truncate action_discussion cascade;

select test.identify_as('yolo@dodo.com');

-- Ajout de deux discussions pour les collectivites 23 et 24
insert into action_discussion(id, collectivite_id, action_id)
values
    (1, 23, 'eci_2'),
    (2, 24, 'eci_2')
;

-- Ajout de deux commentaires à la discussion de la collectivite 23
insert into action_discussion_commentaire (id, discussion_id, message)
values
    (1, 1, 'test message c23'),
    (2, 1, 'test message2 c23'),
    (3, 2, 'test message c24');

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

-- Verification trigger suppression discussion si dernier commentaire
delete from action_discussion_commentaire where id = 3;
select is_empty(
    'select * from action_discussion where id= 2',
    'La discussion devrait ne plus exister');
-- Verification trigger suppression discussion si reste commentaires
delete from action_discussion_commentaire where id = 2;
select isnt_empty(
               'select * from action_discussion where id= 1',
               'La discussion devrait toujours exister');
rollback;
begin;
select plan(3);

truncate action_discussion cascade;

-- Ajout de deux discussions pour les collectivites 23 et 24
insert into action_discussion(collectivite_id, action_id, created_by)
values
    (23, 'eci_2', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
    (24, 'eci_2', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9')
;

-- Ajout de deux commentaires à la discussion de la collectivite 23
insert into action_discussion_commentaire (discussion_id, created_by, message)
select ad.id as discussion_id,
       ad.created_by as created_by,
       'test message c23' as message
from action_discussion ad
where ad.collectivite_id = 23;

insert into action_discussion_commentaire (discussion_id, created_by, message)
select ad.id as discussion_id,
       ad.created_by as created_by,
       'test message2 c23' as message
from action_discussion ad
where ad.collectivite_id = 23;

-- Ajout d'un commentaire à la discussion de la collectivite 24
insert into action_discussion_commentaire (discussion_id, created_by, message)
select ad.id as discussion_id,
       ad.created_by as created_by,
       'test message c24' as message
from action_discussion ad
where ad.collectivite_id = 24;

-- Verification du nombre de discussions total
select ok(
    (select count(*) = 2 from action_discussion_feed),
    'Il y a deux discussions.');

-- Verification du nombre de commentaires par discussion
select ok(
    (select cardinality(commentaires) = 2 from action_discussion_feed where collectivite_id = 23),
    'Il y a deux commentaires dans la discussion de la collectivite 23.');
select ok(
    (select cardinality(commentaires) = 1 from action_discussion_feed where collectivite_id = 24),
    'Il y a un commentaires dans la discussion de la collectivite 24.');

rollback;
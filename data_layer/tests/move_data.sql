begin;
select plan(6);

truncate table action_statut;
truncate table action_commentaire;

insert into action_statut
values (1, 'eci_1.1.1.1', 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

insert into action_commentaire
values (1, 'eci_1.1.1.1', 'yo!', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');


select isnt_empty(
               'select * from action_commentaire where action_id = ''eci_1.1.1.1''',
               'Le commentaire de test est présent'
           );
select isnt_empty(
               'select * from action_statut where action_id = ''eci_1.1.1.1''',
               'Le statut de test est présent'
           );

select private.move_action_data('eci_1.1.1.1', 'eci_1.1.1.2');

select is_empty(
               'select * from action_commentaire where action_id = ''eci_1.1.1.1''',
               'Le commentaire de test est absent'
           );
select is_empty(
               'select * from action_statut where action_id = ''eci_1.1.1.1''',
               'Le statut de test est absent'
           );

select isnt_empty(
               'select * from action_commentaire where action_id = ''eci_1.1.1.2''',
               'Le commentaire de test à été déplacé'
           );

select isnt_empty(
               'select * from action_statut where action_id = ''eci_1.1.1.2''',
               'Le statut de test à été déplacé'
           );

rollback;

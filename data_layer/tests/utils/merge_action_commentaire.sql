begin;
select plan(4);

truncate table action_commentaire;

-- Merge deux commentaires en les concaténant. 
insert into action_commentaire values (1, 'eci_1.1.1', 'Début du commentaire...', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
insert into action_commentaire values (1, 'eci_1.1.1.1', 'Suite du commentaire !', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

select private.merge_action_commentaire('eci_1.1.1', 'eci_1.1.1.1');

select ok((select commentaire = 'Début du commentaire... Suite du commentaire !' from action_commentaire where action_id = 'eci_1.1.1'),
          'Les commentaires ont été mergés dans eci_1.1.1');
select ok((select commentaire = 'Début du commentaire... Suite du commentaire !' from action_commentaire where action_id = 'eci_1.1.1.1'),
          'Les commentaires ont été mergés dans eci_1.1.1.1');

-- Ignore les commentaires qui sont identiques
insert into action_commentaire values (1, 'cae_1.1.1', 'Commentaire qui a été copié/collé.', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
insert into action_commentaire values (1, 'cae_1.1.1.1', 'Commentaire qui a été copié/collé.', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

select private.merge_action_commentaire('cae_1.1.1', 'cae_1.1.1.1');

select ok((select commentaire = 'Commentaire qui a été copié/collé.' from action_commentaire where action_id = 'cae_1.1.1'),
          'Les commentaires ont été mergés dans cae_1.1.1');
select ok((select commentaire = 'Commentaire qui a été copié/collé.' from action_commentaire where action_id = 'cae_1.1.1.1'),
          'Les commentaires ont été mergés dans cae_1.1.1.1');

rollback;

begin;
select plan(8);

-- check que la fonction collectivite_membres retourne autant de membres que d'utilisateurs d'une collectivité
select ok(
        (select count(*) = 3 from collectivite_membres(1)),
        'La collectivité 1 a 3 membres');


-- make uid work as if yolododo user is connected
create or replace function auth.uid() returns uuid as
$$
select '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;

-- Yolo peut modifier les informations de membre de Yili sur la collecticité #1 (car il a les accés admin)
select ok((
    select (update_collectivite_membre_details_fonction(1, '3f407fc6-3634-45ff-a988-301e9088096a', 'Nouveaux détails de la fonction') ->> 'message')::text = 'La fonction du membre a été mise à jour.' ),
    'Yolo peut modifier les informations de membre de Yili sur la collecticité #1 (car il a les accés admin)'); 

select ok((select details_fonction = 'Nouveaux détails de la fonction' from private_collectivite_membre 
where collectivite_id = 1 and user_id = '3f407fc6-3634-45ff-a988-301e9088096a'), 
'Yolo a pu modifier les informations de membre de Yili sur la collecticité #1 (car il a les accés admin)');


-- Yolo ne peut pas modifier les informations de membre de Yili sur la collecticité #2 (car il n'a pas d'acces)
select ok((
    select (update_collectivite_membre_details_fonction(2, '3f407fc6-3634-45ff-a988-301e9088096a', 'Nouveaux détails de la fonction') ->> 'error')::text = 'Vous n''avez pas les droits pour modifier la fonction de ce membre.' ),
    'Yolo ne peut pas modifier les informations de membre de Yili sur la collecticité #2 (car il n''a pas d''acces)'); 


-- Yolo peut éditer ses propres informations de membre sur la collectivité #2 (même si pas admin)
select ok((
    select (update_collectivite_membre_details_fonction(2, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 'Nouveaux détails de la fonction') ->> 'message')::text = 'La fonction du membre a été mise à jour.' ),
    'Yolo peut éditer ses propres informations de membre sur la collectivité #2 (même si pas admin et même si celles-ci n''existent pas encore)'); 

select ok(exists(select details_fonction = 'Nouveaux détails de la fonction' from private_collectivite_membre  where collectivite_id = 2 and user_id = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9' ),
'Yolo a pu créer ses propres informations de membre sur la collectivité #2 (même si pas admin)');

rollback;

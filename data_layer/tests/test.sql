begin;
select plan(8);

select *
into random_admin
from test_add_random_user(10, 'admin');

select set_has(
               'select id, email from auth.users;',
               'select user_id as id, email from random_admin;',
               'The random user should be in the auth.users table.'
           );
select set_has(
               'select user_id, nom, prenom, email from dcp;',
               'select user_id, nom, prenom, email from random_admin;',
               'The random user should be in the dcp table.'
           );

select set_has(
               'select user_id from private_utilisateur_droit where collectivite_id = 10 and niveau_acces = ''admin'';',
               'select user_id from random_admin;',
               'The random user should be in the droits table.'
           );

select test.identify_as('yolo@dodo.com');
select ok(
               (select auth.uid() = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
               'When identifying as yolo, auth.uid() should return his id.'
           );
select ok((is_authenticated()), 'When identifying as yolo is_authenticated should be true');

select test.identify_as('66666666-6666-6666-6666-666666666666'::uuid);
select ok(
               (select auth.uid() = '66666666-6666-6666-6666-666666666666'),
               'When identifying with an uuid, the auth.uid should return it'
           );
select ok((is_authenticated()), 'When identifying with an uuid is_authenticated should be true');

select test.identify_as_service_role();
select ok((is_service_role()), 'When identifying as service role is_service_role should be true');

rollback;

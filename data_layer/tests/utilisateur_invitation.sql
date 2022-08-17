begin;

select plan(16);

-------------------------
-- Invitation creation --
-------------------------
-- As a user.
select *
into random_lecteur
from test_add_random_user(10, 'lecture');

select test.identify_as(user_id)
from random_lecteur;

select ok((select (add_user(99, 'no@no.no', 'admin') -> 'error') is not null),
          'When not associated to the collectivité add_user should return an error');

select ok((select (add_user(10, 'no@no.no', 'admin') -> 'error') is not null),
          'When having only lecture droits to a collectivité add_user should return an error');


-- As an admin.
select *
into random_admin
from test_add_random_user(10, 'admin');

select test.identify_as(user_id)
from random_admin;


--- Add a registered user.
select *
into registered_user
from test_add_random_user(null, null);

select (add_user(10, ru.email, 'edition') ->> 'added') as added
into add_registered_user_1
from registered_user ru;


select ok(aru1.added = 'true',
          'When having admin droits on a collectivité add_user should return added state.')
from add_registered_user_1 aru1;

select isnt_empty('select * from private_utilisateur_droit pud '
                      'join registered_user ru on ru.user_id = pud.user_id and collectivite_id = 10 and niveau_acces = ''edition'';',
                  'The added user should have edition accès on the collectivité.');


--- Add a registered user that is already associated to the collectivité.
select (add_user(10, ru.email, 'admin') ->> 'error') as error
into add_registered_user_2
from registered_user ru;


select ok((select error = 'L''utilisateur est déjà associé à cette collectivité.' from add_registered_user_2),
          'Adding a user already associated to the collectivité should return an error message.');

select is_empty('select * from private_utilisateur_droit pud '
                    'join registered_user ru on ru.user_id = pud.user_id and collectivite_id = 10 and niveau_acces = ''admin'';',
                'Adding a user already associated to the collectivité should not change the niveau d''accès.');

--- Add a registered user that was previously associated to the collectivité but was removed (active=fase)
update private_utilisateur_droit pud
set active = false
from random_lecteur rl
where collectivite_id = 10
  and pud.user_id = rl.user_id;

select add_user(10, rl.email, 'edition') ->> 'added' as added
into add_registered_user_4
from random_lecteur rl;

select ok((select aru4.added = 'true'),
          'When having admin droits on a collectivité add_user should return added state.')
from add_registered_user_4 aru4;

select isnt_empty('select * from private_utilisateur_droit pud '
                      'join random_lecteur rl on rl.user_id = pud.user_id and collectivite_id = 10 and niveau_acces = ''edition'' and active=true;',
                  'The added user should have edition accès on the collectivité.');

--- Add a non-registered user to get an invitation.
select (add_user(10, 'no@no.no', 'edition') ->> 'invitation_id')::uuid as id
into invitation;

select ok(id is not null,
          'When having admin droits on a collectivité add_user should return an invitation id.')
from invitation;

select ok(ui.pending and ui.consumed = false,
          'The newly created invitation should be pending and not consumed.')
from invitation i
         join utilisateur.invitation ui on ui.id = i.id;


----------------------------
-- Invitation consumption --
----------------------------.
select *
into random_visitor
from test_add_random_user(null, null);

select test.identify_as(user_id)
from random_visitor;

select consume_invitation(i.id::uuid)
from invitation i;


select ok(ui.pending = false and ui.consumed,
          'After being consumed the invitation should not pending and consumed.')
from invitation i
         join utilisateur.invitation ui on ui.id = i.id;


select ok(have_admin_acces(10) = false,
          'After being invited the user should not have admin accès.');


select ok(have_edition_acces(10),
          'After being invited the user should have edition accès.');


select ok(have_lecture_acces(10),
          'After being invited the user should have lecture accès.');


-- The invitation shouldn't be consumable anymore.
select *
into random_vilain
from test_add_random_user(null, null);

select test.identify_as(user_id)
from random_vilain;

select consume_invitation(i.id::uuid)
from invitation i;

select ok((select current_setting('response.status') = '403'),
          'Consuming an invitation more than once should return a 403.');

select is_empty('select * from private_utilisateur_droit pud join random_vilain rv on rv.user_id = pud.user_id;',
                'A user consuming a previously consumed invitation should not have any droit.');

rollback;

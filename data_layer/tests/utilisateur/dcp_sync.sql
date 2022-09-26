begin;

select plan(1);

-- Ajoute un lecteur random (crée le user et les dcps).
select *
into lecteur
from test_add_random_user(1, 'lecture');

-- Mets à jour l'email du compte du lecteur.
update auth.users u
set email = 'nono@coco.co'
from lecteur
where u.email = lecteur.email;

select is(
               (select user_id from dcp where email = 'nono@coco.co'),
               (select id from auth.users where email = 'nono@coco.co'),
               'L''email des DCPs devrait être le même que celui de l''authentification.'
           );

rollback;

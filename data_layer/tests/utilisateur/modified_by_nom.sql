begin;
select plan(2);

select test.identify_as('yolo@dodo.com');

select ok(
               (select utilisateur.modified_by_nom(null) ilike 'équipe%'),
               'Le nom devrait commencer par "équipe" quand l''utilisateur est null.'
           );

with yolo as (select id from auth.users where email = 'yolo@dodo.com')
select is(
               (select utilisateur.modified_by_nom(yolo.id)),
               'Yolo Dodo',
               'Le nom de Yolo devrait être "Yolo Dodo".'
           )
from yolo;

rollback;

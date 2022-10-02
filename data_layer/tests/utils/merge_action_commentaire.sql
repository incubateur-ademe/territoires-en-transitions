begin;
select plan(2);
select test.identify_as('yolo@dodo.com');

truncate table action_commentaire;
insert into action_commentaire
values (1, 'eci_1.1.1.1', 'a');
insert into action_commentaire
values (1, 'eci_1.1.1.2', 'b');
select private.merge_action_commentaire('eci_1.1.1.1', 'eci_1.1.1.2');

select results_eq(
               'select commentaire from action_commentaire',
               'select ''a b'' from action_commentaire',
               'Les commentaires a et b devraient être fusionnés.'
           );


truncate table action_commentaire;
insert into action_commentaire
values (1, 'eci_1.1.1.1', 'x');
insert into action_commentaire
values (1, 'eci_1.1.1.2', 'x');
select private.merge_action_commentaire('eci_1.1.1.1', 'eci_1.1.1.2');


select results_eq(
               'select commentaire from action_commentaire',
               'select ''x'' from action_commentaire',
               'Les commentaires identiques ne devraient pas être fusionnés.'
           );

rollback;

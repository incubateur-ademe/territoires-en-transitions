begin;

select plan(2);

-- une premiere table sans colonne modified by.
create table test.a
(
    id    serial primary key,
    value integer
);
select utilisateur.add_modified_by_trigger('test', 'a');


select test.identify_as('yolo@dodo.com');
insert into test.a (value)
values (0);

select is(
               (select modified_by from test.a),
               (select auth.uid()),
               'Le `modified_by` de la table de test A devrait être égal à auth.uid'
           );


-- une seconde table avec modified by.
create table test.b
(
    id          serial primary key,
    value       integer,
    modified_by uuid
);
select utilisateur.add_modified_by_trigger('test', 'b');

-- insert une premiere valeur en tant que yolo.
select test.identify_as('yolo@dodo.com');
insert into test.b (value)
values (1);

-- puis une seconde en tant que yili.
select test.identify_as('yili@didi.com');
insert into test.b (value)
values (2);


select isnt(
               (select modified_by from test.b where value = 1),
               (select auth.uid()),
               'Le premier `modified_by` de la table de test B ne devrait pas être égal à auth.uid'
           );

select is(
               (select modified_by from test.b where value = 2),
               (select auth.uid()),
               'Le second `modified_by` de la table de test B devrait être égal à auth.uid'
           );

-- met à jour la valeur créée par yolo en tant que yili
select test.identify_as('yili@didi.com');
update test.b set value = 3 where value = 1;

select is(
               (select modified_by from test.b where value = 3),
               (select auth.uid()),
               'Le second `modified_by` de la table de test B devrait être égal à auth.uid'
           );

rollback;

begin;

select plan(2);

create table test.a
(
    id    serial primary key,
    value int
);
select private.add_modified_at_trigger('test', 'a');
insert into test.a (value)
values (0);

select is(
               (select modified_at from test.a),
               (select now()),
               'Le `modified_at` de la table de test A devrait être égal à now'
           );


create table test.b
(
    id          serial primary key,
    value       text,
    modified_at timestamptz -- pas de default ici.
);
select private.add_modified_at_trigger('test', 'b');

-- insert une premiere valeur.
insert into test.b (value)
values (1);

-- appel update et donc le trigger.
update test.b
set value = 2
where true;

select is(
               (select modified_at from test.b),
               (select now()),
               'Le `modified_at` de la table de test B devrait être égal à now'
           );

rollback;

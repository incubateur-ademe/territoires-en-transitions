begin;
select plan(1);

-- insert maintenance that is ongoing
insert into maintenance(begins_at, ends_at) values(now(), now() + interval '2 minute'); 

-- check that view ongoing_maintenance is not empty
select isnt_empty(
               'select * from ongoing_maintenance',
               'La vue de maintennance en cours n''est pas vide'
           );

rollback;

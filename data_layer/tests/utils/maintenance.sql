begin;
select plan(2);

-- insert maintenance that is finished
insert into maintenance(begins_at, ends_at) values(now() - interval '2 minute', now() - interval '1 minute'); 

-- check that view ongoing_maintenance is not empty
select is_empty(
               'select * from ongoing_maintenance',
               'La vue de maintennance en cours est vide'
           );


-- insert maintenance that is ongoing
insert into maintenance(begins_at, ends_at) values(now(), now() + interval '2 minute'); 

-- check that view ongoing_maintenance is not empty
select isnt_empty(
               'select * from ongoing_maintenance',
               'La vue de maintennance en cours n''est pas vide'
           );


rollback;

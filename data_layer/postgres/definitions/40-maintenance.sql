create table maintenance
(
    id              serial primary key,
    begins_at timestamp with time zone        not null,
    ends_at timestamp with time zone        not null
);
comment on table maintenance is
    'Utilisé par le client pour afficher un bandeau de maintenance lorsque la base de données est en maintenance';


create or replace view ongoing_maintenance as (
    select now(), begins_at, ends_at from maintenance 
     WHERE now() < ends_at and  now()::date = begins_at::date
     order by ends_at desc limit 1
); 


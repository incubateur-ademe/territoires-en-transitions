-- Deploy tet:utils/maintenance to pg

BEGIN;

create table maintenance
(
    id              serial primary key,
    begins_at timestamp with time zone      not null,
    ends_at timestamp with time zone        not null
);
comment on table maintenance is
    'Utilisé par le client pour afficher un bandeau de maintenance lorsque la base de données est en maintenance';

alter table maintenance
    enable row level security;

create view ongoing_maintenance as 
    select now(), begins_at, ends_at from maintenance 
    where now() < ends_at and  now()::date = begins_at::date
    order by ends_at desc limit 1; 



COMMIT;

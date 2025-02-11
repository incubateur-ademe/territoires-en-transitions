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


create or replace view ongoing_maintenance(now, begins_at, ends_at) as
SELECT now() AS now,
       maintenance.begins_at,
       maintenance.ends_at
FROM maintenance
WHERE now() < maintenance.ends_at
  AND now() > maintenance.begins_at
ORDER BY maintenance.ends_at DESC
LIMIT 1;

COMMIT;

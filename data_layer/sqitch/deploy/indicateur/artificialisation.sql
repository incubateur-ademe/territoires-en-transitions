-- Deploy tet:indicateur/artificialisation to pg

BEGIN;

create table indicateur_artificialisation
(
    collectivite_id integer references collectivite primary key,
    total           integer not null,
    activite        integer not null,
    habitat         integer not null,
    mixte           integer not null,
    routiere        integer not null,
    ferroviaire     integer not null,
    inconnue        integer not null
);
alter table indicateur_artificialisation
    enable row level security;
create policy allow_read on indicateur_artificialisation for select using (true);

COMMIT;

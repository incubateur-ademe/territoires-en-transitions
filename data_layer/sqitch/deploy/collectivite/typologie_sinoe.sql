-- Deploy tet:collectivite/typologie_sinoe to pg

BEGIN;

-- Typologie SINOE (ADEME) des communes et EPCI : urbain, mixte, rural, touristique...
-- id est un code interne dérivé du libellé, code_sinoe le code publié par SINOE (R2, U, M2...)
create table typologie_sinoe
(
    id         varchar(32) primary key,
    code_sinoe varchar(4) not null unique,
    libelle    text       not null
);

alter table typologie_sinoe
    enable row level security;
create policy allow_read_for_all on typologie_sinoe for select using (true);

alter table collectivite
    add column sinoe_id varchar(32) references typologie_sinoe (id);

create index collectivite_sinoe_id on collectivite (sinoe_id);

COMMIT;

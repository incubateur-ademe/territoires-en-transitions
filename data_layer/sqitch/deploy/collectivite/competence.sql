-- Deploy tet:collectivite/competence to pg

BEGIN;

create table banatic_competence
(
    code integer primary key ,
    nom  text              not null
);

alter table banatic_competence enable row level security;
create policy allow_read_for_all on banatic_competence using (true);

COMMIT;

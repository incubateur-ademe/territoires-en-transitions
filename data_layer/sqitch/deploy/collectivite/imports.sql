-- Deploy tet:imports to pg

BEGIN;

create table imports.competence_banatic
(
    siren siren not null,
    competence_code int not null,
    primary key (siren, competence_code)
);

COMMIT;

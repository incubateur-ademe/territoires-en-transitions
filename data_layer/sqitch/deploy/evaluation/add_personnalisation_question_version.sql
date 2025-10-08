-- Deploy tet:evaluation/add_personnalisation_question_version to pg

BEGIN;

alter table question_choix
    add column version varchar(16) not null default '1.0.0';

alter table question
    add column version varchar(16) not null default '1.0.0';

COMMIT;

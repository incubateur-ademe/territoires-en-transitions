-- Deploy tet:collectivite/competence to pg

BEGIN;

drop trigger after_insert_add_competence on epci;
drop function ajoute_competences_banatic;

COMMIT;

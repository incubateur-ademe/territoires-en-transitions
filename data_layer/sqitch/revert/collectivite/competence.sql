-- Revert tet:collectivite/competence from pg

BEGIN;

drop table banatic_competence;

COMMIT;

-- Revert tet:collectivite/competence from pg

BEGIN;

drop table collectivite_banatic_competence;
drop table banatic_competence;

COMMIT;

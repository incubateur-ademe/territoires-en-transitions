-- Verify tet:imports on pg

BEGIN;

select siren, competence_code
from imports.competence_banatic where false;

ROLLBACK;


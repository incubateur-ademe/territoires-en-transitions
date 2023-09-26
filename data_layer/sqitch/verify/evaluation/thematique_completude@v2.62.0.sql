-- Verify tet:evaluation/thematique_completude on pg

BEGIN;

select collectivite_id, id, nom, referentiels, completude
from question_thematique_completude
where false;


ROLLBACK;

-- Verify tet:evaluation/thematique_completude on pg

BEGIN;

comment on type thematique_completude is '';
select has_function_privilege('private.question_count_for_thematique(integer, varchar)', 'execute');
select collectivite_id, id, nom, referentiels, completude
from question_thematique_completude
where false;

ROLLBACK;

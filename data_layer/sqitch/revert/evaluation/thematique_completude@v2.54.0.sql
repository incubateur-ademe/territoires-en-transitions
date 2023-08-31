-- Revert tet:evaluation/thematique_completude from pg

BEGIN;

drop view question_thematique_completude;
drop function private.question_count_for_thematique(collectivite_id integer, thematique_id varchar);
drop type thematique_completude;

COMMIT;

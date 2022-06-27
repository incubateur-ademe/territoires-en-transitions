-- Revert tet:evaluation/question from pg

BEGIN;

drop view question_engine;
drop function business_upsert_questions(questions json[]);
drop view question_thematique_display;
drop table question_action;
drop table question_choix;
drop table question;
drop table question_thematique;

drop domain choix_id;
drop domain question_id;
drop type question_type;

COMMIT;

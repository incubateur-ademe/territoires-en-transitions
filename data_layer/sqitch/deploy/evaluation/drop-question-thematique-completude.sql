-- Deploy tet:evaluation/drop-question-thematique-completude to pg

BEGIN;

drop view if exists question_thematique_completude;
drop function if exists private.reponse_count_by_thematique(int4, varchar);
drop function if exists private.question_count_for_thematique(int4, varchar);
drop trigger if exists after_reponse_insert on reponse_binaire;
drop trigger if exists after_reponse_insert on reponse_choix;
drop trigger if exists after_reponse_insert on reponse_proportion;
drop function if exists after_reponse_insert_write_event();
drop function if exists after_reponse_call_business();

drop view if exists question_thematique_display;
drop view if exists question_display;
drop view if exists reponse_display;

COMMIT;

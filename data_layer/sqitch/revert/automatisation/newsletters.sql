-- Deploy tet:automatisation/newsletters to pg

BEGIN;

drop trigger client_score_edl_complete on client_scores;
drop function automatisation.send_admin_edl_complete;

COMMIT;

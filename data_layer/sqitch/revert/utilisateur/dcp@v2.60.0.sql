-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

drop trigger after_insert_droit on dcp;
drop function after_insert_dcp_add_rights;
drop function est_verifie;
drop function est_support;
drop table utilisateur_verifie;
drop table utilisateur_support;


COMMIT;

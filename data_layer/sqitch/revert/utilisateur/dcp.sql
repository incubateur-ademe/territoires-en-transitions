-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

drop trigger before_insert_support on dcp;
drop function before_insert_check_support;
drop function est_verifie;
drop function est_support;
drop function accepter_cgu();

alter table dcp
    drop column verifie;

alter table dcp
    drop column support;

-- Met à jour le retour de la requête sans les nouvelles colonnes
create or replace function accepter_cgu()
    returns dcp
begin atomic
update dcp
set cgu_acceptees_le = now()
where user_id = auth.uid()
returning *;
end;


COMMIT;

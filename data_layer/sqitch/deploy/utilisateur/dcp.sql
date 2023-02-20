-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

alter table dcp
    add cgu_acceptees_le timestamptz;

create function accepter_cgu()
    returns dcp
begin atomic
    update dcp 
    set cgu_acceptees_le = now()
    where user_id = auth.uid()
    returning *;
end;
comment on function accepter_cgu is 'Inscrit la date à laquelle l''utilisateur a acceptée les CGU.';

COMMIT;

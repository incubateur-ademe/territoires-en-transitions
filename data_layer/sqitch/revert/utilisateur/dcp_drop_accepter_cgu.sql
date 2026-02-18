-- Revert tet:utilisateur/dcp_drop_accepter_cgu from pg

BEGIN;

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

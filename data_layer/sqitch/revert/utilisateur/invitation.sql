-- Revert tet:invitation from pg

BEGIN;

drop function accept_invitation(invitation_id uuid);
drop function latest_invitation(collectivite_id integer);
drop function create_agent_invitation(collectivite_id integer);

drop table private_collectivite_invitation;

COMMIT;

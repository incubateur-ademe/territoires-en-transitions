-- Verify tet:utilisateur/invitation_v2 on pg

BEGIN;

select tag_id, invitation_id, tag_nom
from utilisateur.invitation_personne_tag
where false;

ROLLBACK;

-- Verify tet:utilisateur/invitation_v2 on pg

BEGIN;

select id,
       niveau,
       email,
       collectivite_id,
       created_by,
       created_at,
       accepted_at,
       consumed,
       pending
from utilisateur.invitation
where false;

select invitation_id
from private_utilisateur_droit
where false;

select has_function_privilege('utilisateur.associate(integer, uuid, niveau_acces, uuid)', 'execute');
select has_function_privilege('utilisateur.invite(integer, text,  niveau_acces)', 'execute');

select has_function_privilege('add_user(integer, text, niveau_acces)', 'execute');
select has_function_privilege('consume_invitation(uuid)', 'execute');

ROLLBACK;

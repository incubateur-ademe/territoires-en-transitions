-- Verify tet:utilisateur/niveaux_acces on pg

BEGIN;

comment on type niveau_acces is '';

select id,
       user_id,
       collectivite_id,
       role_name,
       active,
       created_at,
       modified_at,
       niveau_acces
from postgres.public.private_utilisateur_droit
where false;

ROLLBACK;

-- Verify tet:retool/utilisateur_v2 on pg

BEGIN;

select droit_id,
       collectivite_id,
       user_id,
       collectivite,
       niveau_acces,
       active,
       prenom,
       nom,
       email,
       telephone,
       fonction,
       details_fonction,
       champ_intervention
from retool_user_list
where false;

ROLLBACK;

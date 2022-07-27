-- Verify tet:retool/utilisateur on pg

BEGIN;

select has_function_privilege('retool_user_list()', 'execute');

select droit_id,
       collectivite_id,
       user_id,
       collectivite,
       role,
       active,
       nom,
       prenom,
       email
from retool_user_list
where false;

select prenom, nom, email, creation, derniere_connexion, collectivites, nb_collectivite
from retool_user_collectivites_list
where false;

ROLLBACK;

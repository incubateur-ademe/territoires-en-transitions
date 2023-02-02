-- Verify tet:retool/utilisateur on pg

BEGIN;

select prenom, nom, email, creation, derniere_connexion, collectivites, nb_collectivite
from retool_user_collectivites_list
where false;

ROLLBACK;

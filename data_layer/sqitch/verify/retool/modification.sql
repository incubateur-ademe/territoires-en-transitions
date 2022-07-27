-- Verify tet:retool/modification on pg

BEGIN;

select collectivite_id,
       nom,
       statut,
       commentaire,
       plan_action,
       fiche_action,
       indicateur,
       indicateur_commentaire,
       indicateur_perso,
       indicateur_perso_resultat
from retool_last_activity
where false;

ROLLBACK;

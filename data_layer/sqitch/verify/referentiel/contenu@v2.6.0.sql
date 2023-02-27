-- Verify tet:referentiel on pg

BEGIN;

select id, referentiel, parent
from action_relation
where false;

select id, numero, nom
from indicateur_parent
where false;

select modified_at,
       id,
       indicateur_group,
       identifiant,
       valeur_indicateur,
       nom,
       description,
       unite,
       obligation_eci,
       parent
from indicateur_definition
where false;

select modified_at, indicateur_id, action_id
from indicateur_action
where false;

select modified_at,
       action_id,
       referentiel,
       identifiant,
       nom,
       description,
       contexte,
       exemples,
       ressources,
       reduction_potentiel,
       perimetre_evaluation,
       preuve,
       points,
       pourcentage,
       categorie
from action_definition
where false;

select modified_at, action_id, value
from action_computed_points
where false;

ROLLBACK;

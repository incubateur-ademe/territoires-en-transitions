-- Verify tet:panier_action_impact/action_impact on pg

BEGIN;

select id, nom
from panier_partenaire
where false;

select action_impact_id, partenaire_id
from action_impact_partenaire
where false;

ROLLBACK;

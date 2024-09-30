-- Verify tet:panier_action_impact/action_impact on pg

BEGIN;

select id, nom
from panier_partenaire
where false;

select id, nom
from action_impact_typologie
where false;

select action_impact_id, partenaire_id
from action_impact_partenaire
where false;

select id,
       titre,
       description,
       description_complementaire,
       nb_collectivite_en_cours,
       nb_collectivite_realise,
       action_continue,
       temps_de_mise_en_oeuvre,
       fourchette_budgetaire,
       impact_tier,
       subventions_mobilisables,
       ressources_externes,
       rex,
       competences_communales,
       independamment_competences,
       typologie_id
from action_impact
where false;

select action_impact_id, thematique_id, ordre
from action_impact_thematique
where false;

ROLLBACK;

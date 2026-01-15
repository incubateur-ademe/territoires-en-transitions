-- Deploy tet:plan_action/drop_private_plan_action_functions to pg

BEGIN;

drop function if exists private.ajouter_thematique(integer, text);
drop function if exists private.ajouter_sous_thematique(integer, integer);
drop function if exists private.ajouter_partenaire(integer, partenaire_tag);
drop function if exists private.ajouter_structure(integer, structure_tag);
drop function if exists private.ajouter_service(integer, service_tag);
drop function if exists private.ajouter_pilote(integer, personne);
drop function if exists private.ajouter_referent(integer, personne);
drop function if exists private.ajouter_action(integer, action_id);
drop function if exists private.ajouter_financeur(integer, financeur_montant);

COMMIT;


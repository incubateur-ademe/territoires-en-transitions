-- Deploy tet:utils/automatisation to pg

BEGIN;

-- Can't remove enum value

drop trigger utilisateur_droit_delete_automatisation on private_utilisateur_droit;
drop trigger fiche_action_insert_automatisation on fiche_action;
drop trigger axe_insert_automatisation on axe;


drop function automatisation.send_delete_collectivite_membre_json_n8n;
drop function automatisation.send_collectivite_plan_action_json_n8n;
drop view automatisation.collectivite_plan_action;

COMMIT;

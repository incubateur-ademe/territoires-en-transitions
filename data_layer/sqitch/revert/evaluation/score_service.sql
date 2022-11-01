-- Revert tet:evaluation/score_service from pg

BEGIN;

drop function if exists test.enable_evaluation_api();
drop function if exists test.disable_evaluation_api();

drop trigger after_action_statut_insert on postgres.public.action_statut;
drop function after_action_statut_call_business();
drop trigger after_reponse_insert on reponse_binaire;
drop trigger after_reponse_insert on reponse_choix;
drop trigger after_reponse_insert on reponse_proportion;
drop function after_reponse_call_business();
drop function evaluation.evaluate_regles;
drop function evaluation.evaluate_statuts;
drop view evaluation.service_statuts;
drop materialized view evaluation.service_referentiel;
drop view evaluation.service_regles;
drop view evaluation.service_reponses;
drop table evaluation.service_configuration;

-- todo restore prev version
-- Restore le trigger pour mettre à jour le contenu suite à l'insertion de json.
create or replace function
    private.upsert_referentiel_after_json_insert()
    returns trigger
as
$$
declare
begin
    perform private.upsert_actions(new.definitions, new.children);
    return new;
end;
$$ language plpgsql;

COMMIT;

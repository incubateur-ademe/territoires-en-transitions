-- Revert tet:plan_action/historique from pg

BEGIN;

create or replace function delete_fiche_action() returns trigger
    language plpgsql
as
$$
declare
begin
    delete from fiche_action_thematique where fiche_id = old.id;
    delete from fiche_action_sous_thematique where fiche_id = old.id;
    delete from fiche_action_partenaire_tag where fiche_id = old.id;
    delete from fiche_action_structure_tag where fiche_id = old.id;
    delete from fiche_action_pilote where fiche_id = old.id;
    delete from fiche_action_referent where fiche_id = old.id;
    delete from fiche_action_indicateur where fiche_id = old.id;
    delete from fiche_action_action where fiche_id = old.id;
    delete from fiche_action_axe where fiche_id = old.id;
    delete from fiche_action_financeur_tag where fiche_id = old.id;
    delete from fiche_action_service_tag where fiche_id = old.id;
    delete from fiche_action_lien where fiche_une = old.id or fiche_deux = old.id;
    return old;
end;
$$;

drop trigger save_history on fiche_action_pilote;
drop trigger save_history on fiche_action;
drop function historique.save_fiche_action_pilote();
drop function historique.save_fiche_action();
drop table historique.fiche_action_pilote;
drop table historique.fiche_action;

COMMIT;

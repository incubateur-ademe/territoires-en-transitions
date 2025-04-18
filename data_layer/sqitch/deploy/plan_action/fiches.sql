-- Deploy tet:plan_action/fiches to pg

BEGIN;

create or replace function delete_fiche_action() returns trigger
  security definer
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

  alter table fiche_action_lien disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_lien where fiche_une = old.id or fiche_deux = old.id;
  alter table fiche_action_lien enable trigger update_fa_modified_at_and_by;
  return old;
end;
$$;

drop trigger update_fa_modified_at_and_by on fiche_action_action;
drop trigger update_fa_modified_at_and_by on fiche_action_effet_attendu;
drop trigger update_fa_modified_at_and_by on fiche_action_etape;
drop trigger update_fa_modified_at_and_by on fiche_action_financeur_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_indicateur;
drop trigger update_fa_modified_at_and_by on fiche_action_libre_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_note;
drop trigger update_fa_modified_at_and_by on fiche_action_partenaire_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_pilote;
drop trigger update_fa_modified_at_and_by on fiche_action_referent;
drop trigger update_fa_modified_at_and_by on fiche_action_service_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_sous_thematique;
drop trigger update_fa_modified_at_and_by on fiche_action_structure_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_thematique;

drop trigger set_modified_at_before_fiche_action on fiche_action;
drop trigger set_modified_by_before_fiche_action on fiche_action;

COMMIT;


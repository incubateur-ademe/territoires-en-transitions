-- Deploy tet:plan_action/fiches to pg

BEGIN;

create function historique.set_fiche_action_modified_at() returns trigger
  security definer
  language plpgsql
as
$$
begin
  update fiche_action set modified_at = now() where id = new.fiche_id or id = old.fiche_id;
  return coalesce(new, old);
end ;
$$;

create trigger update_fa_modification_date
  after insert or update or delete
  on annexe
  for each row
execute procedure historique.set_fiche_action_modified_at();

create trigger update_fa_modification_date
  after insert or update or delete
  on fiche_action_note
  for each row
execute procedure historique.set_fiche_action_modified_at();

create trigger save_history
  after insert or delete
  on fiche_action_pilote
  for each row
execute procedure historique.set_fiche_action_modified_at();

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
  alter table fiche_action_pilote disable trigger save_history;
  delete from fiche_action_pilote where fiche_id = old.id;
  alter table fiche_action_pilote enable trigger save_history;
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


drop trigger update_fa_modified_at_and_by on annexe;
drop trigger update_fa_modified_at_and_by on fiche_action_action;
drop trigger update_fa_modified_at_and_by on fiche_action_effet_attendu;
drop trigger update_fa_modified_at_and_by on fiche_action_etape;
drop trigger update_fa_modified_at_and_by on fiche_action_financeur_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_indicateur;
drop trigger update_fa_modified_at_and_by on fiche_action_libre_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_lien;
drop trigger update_fa_modified_at_and_by on fiche_action_note;
drop trigger update_fa_modified_at_and_by on fiche_action_partenaire_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_pilote;
drop trigger update_fa_modified_at_and_by on fiche_action_referent;
drop trigger update_fa_modified_at_and_by on fiche_action_service_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_sous_thematique;
drop trigger update_fa_modified_at_and_by on fiche_action_structure_tag;
drop trigger update_fa_modified_at_and_by on fiche_action_thematique;

drop function set_fiche_action_modified_at_and_by;

COMMIT;


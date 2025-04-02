-- Deploy tet:plan_action/fiches to pg

BEGIN;

create or replace function set_fiche_action_modified_at_and_by() returns trigger
  security definer
  language plpgsql
as
$$
declare
  table_name text := TG_TABLE_NAME;
begin
  alter table fiche_action disable trigger set_modified_at_before_fiche_action;
  alter table fiche_action disable trigger set_modified_by_before_fiche_action;
  if (table_name = 'fiche_action_lien') then
    update fiche_action
    set modified_at = now()
    where id = coalesce(new.fiche_une, old.fiche_une);

    update fiche_action
    set modified_at = now()
    where id = coalesce(new.fiche_deux, old.fiche_deux);
  else
    update fiche_action
    set modified_at = now()
    where id = coalesce(new.fiche_id, old.fiche_id);
  end if;
  alter table fiche_action enable trigger set_modified_by_before_fiche_action;
  alter table fiche_action enable trigger set_modified_at_before_fiche_action;
  return coalesce(new, old);
end ;
$$;

-- annexe
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on annexe
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_action
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_action
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_effet_attendu
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_effet_attendu
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_etape
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_etape
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_financeur_tag
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_financeur_tag
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_indicateur
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_indicateur
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_libre_tag
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_libre_tag
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_lien
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_lien
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_note
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_note
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_partenaire_tag
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_partenaire_tag
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_pilote
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_pilote
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_referent
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_referent
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_service_tag
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_service_tag
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_sous_thematique
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_sous_thematique
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_structure_tag
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_structure_tag
  for each row
execute procedure set_fiche_action_modified_at_and_by();

-- fiche_action_thematique
create trigger update_fa_modified_at_and_by
  after insert or update or delete
  on fiche_action_thematique
  for each row
execute procedure set_fiche_action_modified_at_and_by();


create or replace function delete_fiche_action() returns trigger
  security definer
  language plpgsql
as
$$
declare
begin
  alter table fiche_action_thematique disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_thematique where fiche_id = old.id;
  alter table fiche_action_thematique enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_sous_thematique disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_sous_thematique where fiche_id = old.id;
  alter table fiche_action_sous_thematique enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_partenaire_tag disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_partenaire_tag where fiche_id = old.id;
  alter table fiche_action_partenaire_tag enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_structure_tag disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_structure_tag where fiche_id = old.id;
  alter table fiche_action_structure_tag enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_pilote disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_pilote where fiche_id = old.id;
  alter table fiche_action_pilote enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_referent disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_referent where fiche_id = old.id;
  alter table fiche_action_referent enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_indicateur disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_indicateur where fiche_id = old.id;
  alter table fiche_action_indicateur enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_action disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_action where fiche_id = old.id;
  alter table fiche_action_action enable trigger update_fa_modified_at_and_by;

  delete from fiche_action_axe where fiche_id = old.id;

  alter table fiche_action_financeur_tag disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_financeur_tag where fiche_id = old.id;
  alter table fiche_action_financeur_tag enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_service_tag disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_service_tag where fiche_id = old.id;
  alter table fiche_action_service_tag enable trigger update_fa_modified_at_and_by;

  alter table fiche_action_lien disable trigger update_fa_modified_at_and_by;
  delete from fiche_action_lien where fiche_une = old.id or fiche_deux = old.id;
  alter table fiche_action_lien enable trigger update_fa_modified_at_and_by;
  return old;
end;
$$;


drop trigger update_fa_modification_date on annexe;
drop trigger update_fa_modification_date on fiche_action_note;
drop trigger save_history on fiche_action_pilote;
drop function historique.set_fiche_action_modified_at();

COMMIT;


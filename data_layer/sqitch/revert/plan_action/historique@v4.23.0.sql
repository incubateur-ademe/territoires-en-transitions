-- Deploy tet:plan_action/historique to pg

BEGIN;

-- supprime les triggers et la fonction associée
drop trigger save_history on fiche_action_pilote;
drop trigger update_fa_modification_date on annexe;
drop function historique.set_fiche_action_modified_at;

-- recrée la fonction
create or replace function historique.save_fiche_action_pilote() returns trigger
as
$$
begin
    update fiche_action set modified_at = now() where id = new.fiche_id or id = old.fiche_id;
    return coalesce(new, old);
end ;
$$ language plpgsql security definer;

-- et le trigger
create trigger save_history
    after insert or delete
    on fiche_action_pilote
    for each row
execute procedure historique.save_fiche_action_pilote();

COMMIT;

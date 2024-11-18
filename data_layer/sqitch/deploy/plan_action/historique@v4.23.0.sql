-- Deploy tet:plan_action/historique to pg

BEGIN;

-- supprime l'ancien trigger et la fonction associée
drop trigger save_history
    on fiche_action_pilote;
drop function historique.save_fiche_action_pilote;

-- recrée la fonction avec un nom plus générique
create function historique.set_fiche_action_modified_at() returns trigger
as
$$
begin
    update fiche_action set modified_at = now() where id = new.fiche_id or id = old.fiche_id;
    return coalesce(new, old);
end ;
$$ language plpgsql security definer;

-- et recrée le trigger : le changement de la date permet de déclencher l'historisation
create trigger save_history
    after insert or delete
    on fiche_action_pilote
    for each row
execute procedure historique.set_fiche_action_modified_at();

-- ajoute un nouveau trigger pour que la date de modification de la fiche
-- soit aussi màj quand un doc. annexe est ajouté/supprimé de la fiche
create trigger update_fa_modification_date
    after insert or update or delete
    on annexe
    for each row
execute procedure historique.set_fiche_action_modified_at();

COMMIT;

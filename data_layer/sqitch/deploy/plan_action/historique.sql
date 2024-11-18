-- Deploy tet:plan_action/historique to pg

BEGIN;

-- ajoute un nouveau trigger pour que la date de modification de la fiche
-- soit aussi màj quand une note de suivi est ajoutée/modifiée/supprimée de la fiche
create trigger update_fa_modification_date
    after insert or update or delete
    on fiche_action_note
    for each row
execute procedure historique.set_fiche_action_modified_at();

COMMIT;

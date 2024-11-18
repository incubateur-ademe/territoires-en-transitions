-- Deploy tet:plan_action/historique to pg

BEGIN;

drop trigger update_fa_modification_date
    on fiche_action_note;

COMMIT;

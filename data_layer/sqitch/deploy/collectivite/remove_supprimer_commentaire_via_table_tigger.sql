-- Deploy tet:collectivite/remove_supprimer_commentaire_via_table_trigger to pg

BEGIN;

drop trigger supprimer_commentaire_via_table on discussion_message;

COMMIT;

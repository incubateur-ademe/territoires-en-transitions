-- Revert tet:collectivite/remove_supprimer_commentaire_via_table_trigger from pg

BEGIN;

create trigger supprimer_commentaire_via_table
    instead of insert or update
    on public.discussion_message
    for each row
execute procedure supprimer_discussion();

COMMIT;





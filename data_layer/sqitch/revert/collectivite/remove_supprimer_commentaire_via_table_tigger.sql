-- Revert tet:collectivite/remove_supprimer_commentaire_via_table_trigger from pg

BEGIN;

create trigger supprimer_commentaire_via_table after
delete
    on
    public.discussion_message for each row execute function supprimer_discussion();
COMMIT;

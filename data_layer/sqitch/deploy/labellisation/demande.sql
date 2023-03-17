-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

alter table labellisation.demande
    add modified_at timestamp with time zone;

select private.add_modified_at_trigger('labellisation', 'demande');

alter table labellisation.demande
    add envoyee_le timestamp with time zone;

create function
    labellisation.update_demande_envoyee_le()
    returns trigger
as
$$
begin
    -- si le `en_cours` passe de vrai à faux.
    if old.en_cours and not new.en_cours
    then
        new.envoyee_le = current_timestamp;
    end if;
    return new;
end;
$$ language plpgsql;
comment on function labellisation.update_demande_envoyee_le is
    'Mets à jour envoyée le quand le `en_cours` devient false.';

create trigger envoyee_le
    before insert or update
    on labellisation.demande
    for each row
execute procedure labellisation.update_demande_envoyee_le();

COMMIT;

-- Revert tet:labellisation/drop_add_bibliotheque_fichier from pg

BEGIN;

create or replace function public.add_bibliotheque_fichier(
    collectivite_id integer,
    hash varchar,
    filename text,
    confidentiel boolean default false
)
    returns bibliotheque_fichier
as
$$
declare
    inserted     integer;
    return_value bibliotheque_fichier;
begin
    if have_edition_acces(add_bibliotheque_fichier.collectivite_id) or
       private.est_auditeur(add_bibliotheque_fichier.collectivite_id)
    then
        if (select count(o.id) > 0
            from storage.objects o
            join collectivite_bucket cb on o.bucket_id = cb.bucket_id
            where cb.collectivite_id = add_bibliotheque_fichier.collectivite_id
              and o.name = add_bibliotheque_fichier.hash) is not null
        then
            insert into labellisation.bibliotheque_fichier(collectivite_id, hash, filename, confidentiel)
            values (add_bibliotheque_fichier.collectivite_id,
                    add_bibliotheque_fichier.hash,
                    add_bibliotheque_fichier.filename,
                    add_bibliotheque_fichier.confidentiel)
            returning id into inserted;

            select *
            from bibliotheque_fichier bf
            where bf.id = inserted
            into return_value;

            perform set_config('response.status', '201', true);
            return return_value;
        else
            perform set_config('response.status', '404', true);
            return null;
        end if;
    else
        perform set_config('response.status', '403', true);
        return null;
    end if;
end;
$$ language plpgsql security definer;

COMMIT;

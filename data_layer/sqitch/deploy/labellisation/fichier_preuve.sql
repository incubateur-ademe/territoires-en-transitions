-- Deploy tet:labellisation/fichier_preuve to pg
-- requires: labellisation/labellisation
-- requires: collectivite/bucket
BEGIN;
create or replace function update_bibliotheque_fichier_filename(
    collectivite_id integer,
    hash varchar(64),
    filename text
)
    returns void
as
$$
begin
    if have_edition_acces(update_bibliotheque_fichier_filename.collectivite_id)
    then
        update labellisation.bibliotheque_fichier
            set filename = update_bibliotheque_fichier_filename.filename
            where labellisation.bibliotheque_fichier.hash = update_bibliotheque_fichier_filename.hash
              and labellisation.bibliotheque_fichier.collectivite_id = update_bibliotheque_fichier_filename.collectivite_id;

        perform set_config('response.status', '201', true);
    else
        perform set_config('response.status', '403', true);
    end if;
end;
$$ language plpgsql security definer;
comment on function add_bibliotheque_fichier is
    'Modifie un le nom d''un fichier présent dans le bucket de la collectivité à l''adresse `bucket/hash`, dans la bibliothèque de fichiers.';

COMMIT;

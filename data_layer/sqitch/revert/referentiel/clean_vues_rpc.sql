-- Revert tet:referentiel/clean_vues_rpc from pg

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

create or replace function update_bibliotheque_fichier_confidentiel(collectivite_id integer, hash character varying, confidentiel boolean) returns void
    security definer
    language plpgsql
as
$$
begin
    if have_edition_acces(update_bibliotheque_fichier_confidentiel.collectivite_id) or
       private.est_auditeur(update_bibliotheque_fichier_confidentiel.collectivite_id)
    then
        update labellisation.bibliotheque_fichier
        set confidentiel = update_bibliotheque_fichier_confidentiel.confidentiel
        where labellisation.bibliotheque_fichier.hash = update_bibliotheque_fichier_confidentiel.hash
          and labellisation.bibliotheque_fichier.collectivite_id = update_bibliotheque_fichier_confidentiel.collectivite_id;

        perform set_config('response.status', '201', true);
    else
        perform set_config('response.status', '403', true);
    end if;
end;
$$;

create or replace function labellisation_peut_commencer_audit(
  collectivite_id integer, referentiel referentiel
) returns boolean
  stable
  security definer
  language sql
BEGIN
  ATOMIC
  SELECT ((a.date_debut IS NULL) AND (auth.uid() IN (SELECT aa.auditeur
                                                     FROM audit_auditeur aa
                                                     WHERE (a.id = aa.audit_id))))
  FROM labellisation.audit a
  WHERE a.collectivite_id = labellisation_peut_commencer_audit.collectivite_id
    AND a.referentiel = labellisation_peut_commencer_audit.referentiel
    AND a.clos = false
    AND now() <@ tstzrange(a.date_debut, a.date_fin)
  ORDER BY a.date_debut DESC NULLS LAST
  LIMIT 1;
END;

COMMIT;

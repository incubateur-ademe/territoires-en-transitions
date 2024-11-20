-- Deploy tet:labellisation/audit to pg
BEGIN;

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

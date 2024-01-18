-- Deploy tet:labellisation/audit to pg
BEGIN;

create or replace function
    labellisation_peut_commencer_audit(collectivite_id integer, referentiel referentiel)
    returns bool
begin
    atomic
    select count(*) > 0
    from audit a
             join audit_auditeur aa on a.id = aa.audit_id
    where a.collectivite_id = labellisation_peut_commencer_audit.collectivite_id
      and a.referentiel = labellisation_peut_commencer_audit.referentiel
      and a.date_debut is null
      and aa.auditeur = auth.uid();
end;

COMMIT;

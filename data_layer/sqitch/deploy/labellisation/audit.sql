-- Deploy tet:labellisation/audit to pg
BEGIN;

create or replace function
    labellisation_peut_commencer_audit(collectivite_id integer, referentiel referentiel)
    returns bool
    security definer
    language sql
    stable
begin
    atomic
    select
        -- audit non commencé
        date_debut is null
            -- dont l'utilisateur est l'auditeur
            and auth.uid() in (select auditeur from audit_auditeur aa where a.id = aa.audit_id)
    from labellisation.audit a
    -- l'audit en cours ou non commencé
    where a.collectivite_id = labellisation_peut_commencer_audit.collectivite_id
      and a.referentiel = labellisation_peut_commencer_audit.referentiel
      and now() <@ tstzrange(date_debut, date_fin)
    -- les audits avec une date de début sont prioritaires sur ceux avec une plage infinie,
    -- ces derniers comprenant toujours `now()`.
    order by date_debut desc nulls last
    limit 1;
end;

COMMIT;

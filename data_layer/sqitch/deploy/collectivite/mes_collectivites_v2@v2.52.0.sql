-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

alter function est_auditeur(integer) set schema private;

create or replace function
    labellisation.active_audit(collectivite_id integer, referentiel referentiel)
    returns labellisation.audit
begin
    atomic
    select *
    from labellisation.audit a
    where a.collectivite_id = active_audit.collectivite_id
      and a.referentiel = active_audit.referentiel
      and now() <@ tstzrange(date_debut, date_fin)
      -- on exclu les audits avec une plage infinie.
      and date_debut is not null;
end;
comment on function labellisation.active_audit is
    'L''audit actif pour une collectivité et un référentiel donné, peut renvoyer null.';

create or replace function est_auditeur(collectivite integer, referentiel referentiel)
    returns boolean
begin
    atomic
    select coalesce(bool_or(auth.uid() = aa.auditeur), false)
    from labellisation.active_audit(est_auditeur.collectivite, est_auditeur.referentiel) ca
             join audit_auditeur aa on ca.id = aa.audit_id;
end;
comment on function est_auditeur(integer, referentiel) is
    'Vrai si l''utilisateur courant est auditeur sur une collectivité et un référentiel';

create or replace function private.est_auditeur(col integer)
    returns boolean
begin
    atomic
    with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
    select bool_or(ea)
    from ref
             join est_auditeur(est_auditeur.col, ref.referentiel) ea on true;
end;
comment on function private.est_auditeur(integer) is
    'Vrai si l''utilisateur courant est auditeur sur une collectivité pour au moins un référentiel';

COMMIT;

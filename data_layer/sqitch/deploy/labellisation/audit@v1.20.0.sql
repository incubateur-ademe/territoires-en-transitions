-- Deploy tet:labellisation/audit to pg
BEGIN;

create view auditeurs
as
with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
select c.id                                                                as collectivite_id,
       a.id                                                                as audit_id,
       a.referentiel                                                       as referentiel,
       jsonb_agg(jsonb_build_object('nom', dcp.nom, 'prenom', dcp.prenom)) as noms
from collectivite c
         join ref on true
         join labellisation.current_audit(c.id, ref.referentiel) a on true
         join audit_auditeur aa on aa.audit_id = a.id
         join utilisateur.dcp_display dcp on aa.auditeur = dcp.user_id
where is_authenticated() -- protège les DCPs.
group by c.id, a.id, a.referentiel;

comment on view auditeurs is
    'Les auditeurs par collectivité et référentiel pour les audits en cours.';

COMMIT;

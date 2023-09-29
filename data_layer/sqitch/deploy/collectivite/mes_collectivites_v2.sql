-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

create or replace view mes_collectivites(collectivite_id, nom, niveau_acces, est_auditeur, access_restreint) as
with
    droits_collectivite as (
        select collectivite_id, niveau_acces
        from private_utilisateur_droit
        where user_id = auth.uid()
          and active
    ),
    droits_auditeur as (
        select distinct la.collectivite_id
        from  audit_auditeur aa
                  join labellisation.audit la on aa.audit_id = la.id
        where la.date_fin is null
          and auditeur = auth.uid()
    ),
    droits as (
        select collectivite_id
        from droits_collectivite
        union
        select collectivite_id
        from droits_auditeur
    )
select d.collectivite_id,
       cn.nom,
       pud.niveau_acces,
       (select count(*)>0 from droits_auditeur da where da.collectivite_id = d.collectivite_id) as est_auditeur,
       c.access_restreint
from droits d
         join collectivite c on d.collectivite_id = c.id
         join named_collectivite cn using (collectivite_id)
         left join droits_collectivite pud using (collectivite_id);

COMMIT;

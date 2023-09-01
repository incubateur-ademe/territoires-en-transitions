-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

create or replace view mes_collectivites(collectivite_id, nom, niveau_acces, est_auditeur, access_restreint) as
select pud.collectivite_id,
       cn.nom,
       pud.niveau_acces,
       private.est_auditeur(c.id) as est_auditeur,
       c.access_restreint

from private_utilisateur_droit pud
         join collectivite c on pud.collectivite_id = c.id
         join named_collectivite cn using (collectivite_id)
where user_id = auth.uid()
  and active;

COMMIT;

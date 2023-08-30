-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

create or replace view mes_collectivites(collectivite_id, nom, niveau_acces, est_auditeur) as
select collectivite_id,
       nom,
       niveau_acces,
       private.est_auditeur(named_collectivite.collectivite_id) as est_auditeur
from private_utilisateur_droit pud
join named_collectivite using (collectivite_id)
where user_id = auth.uid()
  and active;

COMMIT;

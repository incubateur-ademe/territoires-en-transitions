-- Revert tet:collectivite/delete-view-collectivite-niveau-acces from pg

BEGIN;

create or replace view collectivite_niveau_acces
as
with current_droits as (select *
                        from private_utilisateur_droit
                        where user_id = auth.uid()
                          and active)
select named_collectivite.collectivite_id,
       named_collectivite.nom,
       niveau_acces,
       est_auditeur(named_collectivite.collectivite_id) as est_auditeur,
       c.access_restreint
from named_collectivite
         left join current_droits on named_collectivite.collectivite_id = current_droits.collectivite_id
        left join collectivite c on named_collectivite.collectivite_id = c.id
order by unaccent(nom);

COMMIT;

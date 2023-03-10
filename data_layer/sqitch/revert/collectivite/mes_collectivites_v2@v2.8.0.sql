-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

drop view mes_collectivites;
drop view collectivite_niveau_acces;
drop function if exists est_auditeur;

-- permet au client d'afficher les noms des collectivités et de les filtrer sur les critères de droits.
create or replace view collectivite_niveau_acces
as
with current_droits as (select *
                        from private_utilisateur_droit
                        where user_id = auth.uid()
                          and active)
select named_collectivite.collectivite_id,
       named_collectivite.nom,
       niveau_acces
from named_collectivite
         left join current_droits on named_collectivite.collectivite_id = current_droits.collectivite_id
order by unaccent(nom);

create or replace view mes_collectivites
as
select *
from collectivite_niveau_acces
where niveau_acces is not null
order by unaccent(nom);

COMMIT;

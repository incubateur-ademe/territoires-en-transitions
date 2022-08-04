-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

-- retire une fonction dépréciée
drop function if exists collectivite_user_list;

-- permet au client d'afficher les noms des collectivités et de les filtrer sur les critères de droits.
create view collectivite_niveau_acces
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

-- remplace la vue owned_collectivite qui a été retirée depuis utilisateur/niveaux_acces
create view mes_collectivites
as
select *
from collectivite_niveau_acces
where niveau_acces is not null
order by unaccent(nom);

COMMIT;

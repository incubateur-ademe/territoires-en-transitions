-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

-- retire une fonction dépréciée
drop function collectivite_user_list;

-- remplace la vue owned_collectivite qui a été retirée depuis utilisateur/niveaux_acces
create view mes_collectivites
as
with current_droits as (select *
                        from private_utilisateur_droit
                        where user_id = auth.uid()
                          and active)
select named_collectivite.collectivite_id,
       named_collectivite.nom,
       niveau_acces
from current_droits
         join named_collectivite on named_collectivite.collectivite_id = current_droits.collectivite_id
order by nom;

COMMIT;

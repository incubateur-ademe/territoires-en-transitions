-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

-- retire une fonction dépréciée
drop function collectivite_user_list;

-- remplace la vue qui a été retirée depuis utilisateur/niveaux_acces
create view elses_collectivite
as
with joined_collectivite as (select collectivite_id
                             from private_utilisateur_droit
                             where user_id = auth.uid()
                               and active)
select active_collectivite.collectivite_id, active_collectivite.nom
from active_collectivite
         full outer join joined_collectivite
                         on joined_collectivite.collectivite_id = active_collectivite.collectivite_id
where auth.uid() is null -- return all active collectivités if auth.user is null
   or joined_collectivite is null;
comment on view elses_collectivite
    is 'Collectivités pour lesquelles l''utilisateur n''a pas de droits.';

COMMIT;

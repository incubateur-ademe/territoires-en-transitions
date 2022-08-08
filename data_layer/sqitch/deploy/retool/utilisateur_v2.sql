-- Deploy tet:retool/utilisateur_v2 to pg
-- requires: utilisateur/droits_v2

BEGIN;

create view retool_user_list
as
select d.id              as droit_id,
       d.collectivite_id as collectivite_id,
       d.user_id         as user_id,
       nc.nom            as collectivite,
       d.niveau_acces,
       d.active,
       p.prenom,
       p.nom,
       p.email,
       p.telephone,
       m.fonction,
       m.details_fonction,
       m.champ_intervention
from private_utilisateur_droit d
         join named_collectivite nc on d.collectivite_id = nc.collectivite_id
         left join utilisateur.dcp_display p on p.user_id = d.user_id
         left join private_collectivite_membre m
                   on m.user_id = d.user_id and m.collectivite_id = d.collectivite_id
where is_service_role() -- Protect the DCPs.
;
comment on view retool_user_list is
    'La liste des utilisateurs pour Retool.';

COMMIT;

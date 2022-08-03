-- Deploy tet:utilisateur/dcp_display to pg
-- requires: utilisateur/dcp

BEGIN;

create view utilisateur.dcp_display
as
select user_id,
       case
           when limited
               then 'compte désactivé'
           when deleted
               then 'compte supprimé'
           else nom
           end as nom,
       case
           when limited or deleted
               then ''
           else prenom
           end as prenom,
       case
           when limited or deleted
               then ''
           else email
           end as email,
       limited,
       deleted,
       created_at,
       modified_at,
       case
           when limited or deleted
               then ''
           else telephone
           end as telephone
from dcp;
comment on view utilisateur.dcp_display is
    'Les DCPs à afficher, les informations sont anonymisées en cas de désactivation ou de suppression du compte.';

COMMIT;

-- Deploy tet:utilisateur/niveaux_acces to pg
-- requires: utilisateur/droits

BEGIN;

create type niveau_acces as enum ('admin', 'edition', 'lecture');
comment on type niveau_acces
    is 'Détermine les droits sur les données.';

alter table private_utilisateur_droit
    add niveau_acces niveau_acces not null default 'lecture';

update private_utilisateur_droit
set niveau_acces =
        case
            when role_name = 'referent' then 'admin'
            when role_name = 'agent' then 'edition'
            when role_name = 'conseiller' then 'edition'
            when role_name = 'auditeur' then 'lecture'
            when role_name = 'aucun' then 'lecture'
            end::niveau_acces
where active;

drop view elses_collectivite;
drop view owned_collectivite;
drop view retool_user_list;

alter table private_utilisateur_droit
    drop column role_name;

COMMIT;

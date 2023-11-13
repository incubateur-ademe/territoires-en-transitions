-- Deploy tet:indicateur/detail to pg

BEGIN;

-- Fonction devenue redondante avec thematique(indicateur_definitions);
drop function thematiques(indicateur_definitions);


-- On supprime des fonctions pour :
-- - fusionner indicateur_pilote et indicateur_personnalise_pilote
-- - fusionner indicateur_service_tag et indicateur_personnalise_service_tag
drop function pilotes(indicateur_definitions);
drop function private.get_personne(indicateur_personnalise_pilote);
drop function services(indicateur_definitions);


-- Fusionne indicateur_pilote et indicateur_personnalise_pilote
-- - On commence par copier les données des deux tables dans le schéma migration
create table if not exists migration.indicateur_personnalise_pilote as
    table indicateur_personnalise_pilote;
create table if not exists migration.indicateur_pilote as
    table indicateur_pilote;

-- - indicateur_id peut être null si on référence un indicateur perso
alter table indicateur_pilote
    alter column indicateur_id drop not null;

-- - ajoute indicateur_perso_id pour référencer un indicateur perso
alter table indicateur_pilote
    add indicateur_perso_id integer;

alter table indicateur_pilote
    add constraint indicateur_pilote_indicateur_personnalise_definition_id_fk
        foreign key (indicateur_perso_id) references indicateur_personnalise_definition;

-- - change la contrainte d'unicité
alter table indicateur_pilote
    drop constraint indicateur_pilote_indicateur_id_collectivite_id_user_id_tag_key;

alter table indicateur_pilote
    add constraint indicateur_pilote_indicateur_id_collectivite_id_user_id_tag_key
        unique (indicateur_id, indicateur_perso_id, collectivite_id, user_id, tag_id);

-- - vérifie que les colonnes sont cohérentes.
alter table indicateur_pilote
    add constraint perso_ou_predefini
        check ( -- prédéfini
                (indicateur_id is not null and collectivite_id is not null and indicateur_perso_id is null)
                -- personnalisé
                or (indicateur_perso_id is not null and indicateur_id is null and collectivite_id is null)
            );
comment on constraint perso_ou_predefini on indicateur_pilote is
    'Vérifie que l''on référence un indicateur perso ou un indicateur prédéfini.';

alter table indicateur_pilote
    add constraint tag_ou_utilisateur
        check ( -- tag
                (tag_id is not null and user_id is null)
                -- utilisateur
                or (user_id is not null and tag_id is null)
            );
comment on constraint tag_ou_utilisateur on indicateur_pilote is
    'Vérifie que le pilote est un tag ou un utilisateur.';

-- - les colonnes nullables, deviennent nulles par défaut
alter table indicateur_pilote
    alter column indicateur_id set default null;
alter table indicateur_pilote
    alter column collectivite_id set default null;
alter table indicateur_pilote
    alter column user_id set default null;
alter table indicateur_pilote
    alter column tag_id set default null;
alter table indicateur_pilote
    alter column indicateur_perso_id set default null;

-- - on migre les données
insert into indicateur_pilote (user_id, tag_id, indicateur_perso_id)
select user_id, tag_id, indicateur_id
from indicateur_personnalise_pilote as ipp;

-- - on supprime la table désormais redondante
drop table indicateur_personnalise_pilote;


-- Fusionne indicateur_service_tag et indicateur_personnalise_service_tag
-- - On commence par copier les données des deux tables dans le schéma migration
create table if not exists migration.indicateur_personnalise_service as
    table indicateur_personnalise_service_tag;
create table if not exists migration.indicateur_service as
    table indicateur_service_tag;

-- - enlève des primary key
alter table indicateur_service_tag
    drop constraint indicateur_service_tag_pkey;

-- - indicateur_id peut être null si on référence un indicateur perso
alter table indicateur_service_tag
    alter column indicateur_id drop not null;
alter table indicateur_service_tag
    alter column collectivite_id drop not null;

-- - ajoute indicateur_perso_id pour référencer un indicateur perso
alter table indicateur_service_tag
    add indicateur_perso_id integer;

alter table indicateur_service_tag
    add constraint indicateur_service_tag_indicateur_personnalise_definition_id_fk
        foreign key (indicateur_perso_id) references indicateur_personnalise_definition;

alter table indicateur_service_tag
    add constraint indicateur_service_tag_indicateur_collectivite_tag_key
        unique (indicateur_id, indicateur_perso_id, collectivite_id, service_tag_id);

-- - vérifie que les colonnes sont cohérentes.
alter table indicateur_service_tag
    add constraint perso_ou_predefini
        check ( -- prédéfini
                (indicateur_id is not null and collectivite_id is not null and indicateur_perso_id is null)
                -- personnalisé
                or (indicateur_perso_id is not null and indicateur_id is null and collectivite_id is null)
            );
comment on constraint perso_ou_predefini on indicateur_service_tag is
    'Vérifie que l''on référence un indicateur perso ou un indicateur prédéfini.';

-- - les colonnes nullables, deviennent nulles par défaut
alter table indicateur_service_tag
    alter column indicateur_id set default null;
alter table indicateur_service_tag
    alter column collectivite_id set default null;
alter table indicateur_service_tag
    alter column indicateur_perso_id set default null;

-- - on migre les données
insert into indicateur_service_tag (service_tag_id, indicateur_perso_id)
select service_tag_id, indicateur_id
from indicateur_personnalise_service_tag as ipp;

-- - on supprime la table désormais redondante
drop table indicateur_personnalise_service_tag;


-- Get personne
create or replace function
    private.get_personne(indicateur_pilote)
    returns personne
    security definer
begin
    atomic
    select case
               when $1.tag_id is not null
                   then (select row (pt.nom, pt.collectivite_id, $1.tag_id, null::uuid)::personne
                         from personne_tag pt
                         where pt.id = $1.tag_id)
               else (select row (u.prenom || ' ' || u.nom, $1.collectivite_id, null::integer, u.user_id)::personne
                     from utilisateur.dcp_display u
                     where u.user_id = $1.user_id)
               end;
end;
comment on function private.get_personne(indicateur_pilote) is
    'Renvoie la personne pilote d''un indicateur.';

COMMIT;

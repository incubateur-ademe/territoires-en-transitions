-- Revert tet:indicateur/fusion from pg

BEGIN;

-- Supprimer trigger insert indicateur json
drop trigger after_indicateurs_json on indicateurs_json;
drop function private.upsert_indicateurs_after_json_insert;

-- Supprime les nouveaux éléments autres que les tables
drop function public.indicateur_pilote_user(indicateur_pilote);
drop function public.indicateur_enfants(indicateur_definition);
drop function public.indicateur_parents(indicateur_definition);

-- Supprime les éléments indirectement liés aux indicateurs
drop view public.indicateur_summary;
drop function public.indicateurs_gaz_effet_serre(site_labellisation);
drop function public.create_fiche;
drop trigger delete on public.fiche_action; -- Utilise public.delete_fiche_action
drop function public.delete_fiche_action; -- trigger
drop function public.fiche_resume(fiche_action_indicateur);
drop function public.plan_action_export; -- Utilise public.fiches_action
drop trigger upsert on public.fiches_action; -- Utilise public.upsert_fiche_action
drop function public.upsert_fiche_action; -- Utilise private.ajouter_indicateur & trigger
drop function private.ajouter_indicateur;
drop function private.enlever_indicateur;
drop function stats.refresh_reporting; -- Utilise stats indicateurs
drop function stats.refresh_views; -- Utilise stats indicateurs
drop function stats.refresh_views_crm; -- Utilise stats indicateurs
drop view public.crm_indicateurs; -- Utilise stats.crm_indicateurs
drop materialized view stats.crm_indicateurs;
drop view public.crm_usages; -- Utilise stats.crm_usages
drop materialized view stats.crm_usages;
drop view public.fiches_action; -- Utilise private.fiches_action
drop view private.fiches_action;
drop view public.stats_evolution_indicateur_referentiel; -- Utilise stats.evolution_indicateur_referentiel
drop materialized view stats.evolution_indicateur_referentiel;
drop view public.stats_evolution_resultat_indicateur_personnalise; -- Utilise stats.evolution_resultat_indicateur_personnalise
drop materialized view stats.evolution_resultat_indicateur_personnalise;
drop view public.stats_evolution_resultat_indicateur_referentiel; -- Utilise stats.evolution_resultat_indicateur_referentiel
drop materialized view stats.evolution_resultat_indicateur_referentiel;
drop view public.stats_locales_evolution_collectivite_avec_indicateur; -- Utilise stats.locales_evolution_collectivite_avec_indicateur_referentiel
drop materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel;
drop view public.stats_locales_evolution_indicateur_referentiel; -- Utilise stats.locales_evolution_indicateur_referentiel
drop materialized view stats.locales_evolution_indicateur_referentiel;
drop view public.stats_locales_evolution_resultat_indicateur_personnalise; -- Utilise stats.locales_evolution_resultat_indicateur_personnalise
drop materialized view stats.locales_evolution_resultat_indicateur_personnalise;
drop view public.stats_locales_evolution_resultat_indicateur_referentiel; -- Utilise stats.locales_evolution_resultat_indicateur_referentiel
drop materialized view stats.locales_evolution_resultat_indicateur_referentiel;
drop materialized view stats.report_indicateur_personnalise;
drop materialized view stats.report_indicateur_resultat;

-- Supprime les droits des nouvelles tables
drop policy allow_read on public.indicateur_pilote;
drop policy allow_insert on public.indicateur_pilote;
drop policy allow_update on public.indicateur_pilote;
drop policy allow_delete on public.indicateur_pilote;

drop policy allow_read on public.indicateur_service_tag;
drop policy allow_insert on public.indicateur_service_tag;
drop policy allow_update on public.indicateur_service_tag;
drop policy allow_delete on public.indicateur_service_tag;

drop policy allow_read on public.indicateur_sous_thematique;
drop policy allow_insert on public.indicateur_sous_thematique;
drop policy allow_update on public.indicateur_sous_thematique;
drop policy allow_delete on public.indicateur_sous_thematique;

drop policy allow_read on public.indicateur_thematique;
drop policy allow_insert on public.indicateur_thematique;
drop policy allow_update on public.indicateur_thematique;
drop policy allow_delete on public.indicateur_thematique;

drop policy allow_read on public.indicateur_categorie_tag;
drop policy allow_insert on public.indicateur_categorie_tag;
drop policy allow_update on public.indicateur_categorie_tag;
drop policy allow_delete on public.indicateur_categorie_tag;

drop policy allow_read on public.categorie_tag;
drop policy allow_insert on public.categorie_tag;
drop policy allow_update on public.categorie_tag;
drop policy allow_delete on public.categorie_tag;

drop policy allow_read on public.indicateur_collectivite;
drop policy allow_insert on public.indicateur_collectivite;
drop policy allow_update on public.indicateur_collectivite;
drop policy allow_delete on public.indicateur_collectivite;

drop policy allow_read on public.indicateur_groupe;
drop policy allow_insert on public.indicateur_groupe;
drop policy allow_update on public.indicateur_groupe;
drop policy allow_delete on public.indicateur_groupe;

drop policy allow_read on public.indicateur_valeur;
drop policy allow_insert on public.indicateur_valeur;
drop policy allow_update on public.indicateur_valeur;
drop policy allow_delete on public.indicateur_valeur;

drop policy allow_read on public.indicateur_definition;
drop policy allow_insert on public.indicateur_definition;
drop policy allow_update on public.indicateur_definition;
drop policy allow_delete on public.indicateur_definition;

drop policy  allow_read on public.indicateur_action;
drop policy allow_insert on public.indicateur_action;
drop policy allow_update on public.indicateur_action;
drop policy allow_delete on public.indicateur_action;

drop policy  allow_read on public.fiche_action_indicateur;
drop policy allow_insert on public.fiche_action_indicateur;
drop policy allow_update on public.fiche_action_indicateur;
drop policy allow_delete on public.fiche_action_indicateur;

drop policy  allow_read on public.action_impact_indicateur;
drop policy allow_insert on public.action_impact_indicateur;
drop policy allow_update on public.action_impact_indicateur;
drop policy allow_delete on public.action_impact_indicateur;

drop policy allow_read on public.indicateur_source_metadonnee;

drop policy allow_read on public.groupement_collectivite;

drop policy allow_read on public.groupement;

-- Supprime les fonctions permettant de gérer les droits des nouvelles tables
drop function peut_modifier_la_categorie_d_indicateur;
drop function peut_lire_la_categorie_d_indicateur;
drop function peut_ajouter_une_valeur_a_l_indicateur;
drop function peut_modifier_l_indicateur;
drop function peut_lire_l_indicateur;
drop function is_indicateur_confidential;
drop function is_indicateur_collectivite;

-- Supprime les nouvelles tables
drop table public.action_impact_indicateur;
drop table public.fiche_action_indicateur;
drop table public.indicateur_action;
drop table public.indicateur_pilote;
drop table public.indicateur_service_tag;
drop table public.indicateur_sous_thematique;
drop table public.indicateur_thematique;
drop table public.indicateur_categorie_tag;
drop table public.categorie_tag;
drop table public.indicateur_collectivite;
drop table public.indicateur_groupe;
drop table public.indicateur_valeur;
drop table public.indicateur_definition;
drop table public.indicateur_source_metadonnee;
drop table public.groupement_collectivite;
drop table public.groupement;

-- Recrée les types indicateurs en conflit
alter type old_indicateur_thematique rename to indicateur_thematique;

-- Recrée anciennes tables
-- Modifie la table indicateur_source pour supprimer l'attribut ordre
alter table public.indicateur_source drop column ordre_affichage;

-- indicateur_parent; (table vide)
create table public.indicateur_parent
(
    id     serial
        primary key,
    numero text not null
        unique,
    nom    text not null
);
comment on table indicateur_parent is 'An optional parent used to group indicateurs together.';

-- indicateur_definition;
create table public.indicateur_definition
(
    id                  indicateur_id                                                     not null
        primary key,
    identifiant         text,
    valeur_indicateur   indicateur_id
        references indicateur_definition,
    nom                 text                                                              not null,
    description         text                                                              not null,
    unite               text                                                              not null,
    participation_score boolean                 default false                             not null,
    selection           boolean                 default false                             not null,
    titre_long          text                    default ''::text                          not null,
    parent              indicateur_id,
    source              text,
    type                indicateur_referentiel_type,
    thematiques         indicateur_thematique[] default ARRAY []::indicateur_thematique[] not null,
    programmes          indicateur_programme[]  default ARRAY []::indicateur_programme[]  not null,
    sans_valeur         boolean                 default false                             not null
)
    inherits (abstract_modified_at);
comment on table indicateur_definition is 'Indicateur definition from markdown. Populated by business';
comment on column indicateur_definition.participation_score is 'Vrai si il est prévu que l''indicateur participe au score du référentiel.';
comment on column indicateur_definition.titre_long is 'Le titre complet.';
comment on column indicateur_definition.parent is 'L''id de l''indicateur parent.';
comment on column indicateur_definition.source is 'La source de la donnée.';
comment on column indicateur_definition.type is 'Le type d''indicateur, résultat ou impact.';

insert into public.indicateur_definition select * from archive.indicateur_definition;

-- indicateur_action;
create table public.indicateur_action
(
    indicateur_id indicateur_id not null
        references indicateur_definition
            on delete cascade,
    action_id     action_id     not null
        references action_relation
            on delete cascade,
    primary key (indicateur_id, action_id)
)
    inherits (abstract_modified_at);
comment on table indicateur_action is 'Indicateur <-> Action many-to-many relationship';

insert into indicateur_action select * from archive.indicateur_action;

-- indicateur_resultat;
create table public.indicateur_resultat
(
    collectivite_id integer       not null
        references collectivite,
    indicateur_id   indicateur_id not null
        references indicateur_definition,
    modified_by     uuid,
    primary key (collectivite_id, annee, indicateur_id)
)
    inherits (abstract_any_indicateur_value);

insert into public.indicateur_resultat select * from archive.indicateur_resultat;

-- indicateur_resultat_commentaire;
create table public.indicateur_resultat_commentaire
(
    collectivite_id integer                 not null
        constraint indicateur_commentaire_collectivite_id_fkey
            references collectivite,
    indicateur_id   indicateur_id           not null
        constraint indicateur_commentaire_indicateur_id_fkey
            references indicateur_definition,
    commentaire     text                    not null,
    modified_by     uuid default auth.uid() not null
        constraint indicateur_commentaire_modified_by_fkey
            references auth.users,
    annee           integer,
    constraint unique_collectivite_indicateur_annee
        unique (collectivite_id, indicateur_id, annee)
)
    inherits (abstract_modified_at);
comment on column indicateur_resultat_commentaire.annee is 'L''année du résultat sur lequel porte le commentaire.';

insert into public.indicateur_resultat_commentaire select * from archive.indicateur_resultat_commentaire;

-- indicateur_resultat_import;
create table public.indicateur_resultat_import
(
    collectivite_id integer                  not null
        references collectivite,
    indicateur_id   indicateur_id            not null
        references indicateur_definition,
    annee           integer                  not null,
    valeur          double precision         not null,
    modified_at     timestamp with time zone not null,
    source          text                     not null,
    source_id       text                     not null
        references indicateur_source,
    primary key (collectivite_id, indicateur_id, annee, source_id)
);
comment on table indicateur_resultat_import is 'Les résultats importés de sources extérieures';

insert into public.indicateur_resultat_import select * from archive.indicateur_resultat_import;

-- indicateur_objectif;
create table public.indicateur_objectif
(
    collectivite_id integer       not null
        references collectivite,
    indicateur_id   indicateur_id not null
        references indicateur_definition,
    modified_by     uuid,
    primary key (collectivite_id, annee, indicateur_id)
)
    inherits (abstract_any_indicateur_value);

insert into public.indicateur_objectif select * from archive.indicateur_objectif;

-- indicateur_objectif_commentaire;
create table public.indicateur_objectif_commentaire
(
    collectivite_id integer                  not null
        references collectivite,
    indicateur_id   indicateur_id            not null
        references indicateur_definition,
    annee           integer                  not null,
    commentaire     text                     not null,
    modified_by     uuid                     not null
        references auth.users,
    modified_at     timestamp with time zone not null,
    constraint indicateur_objectif_commentai_collectivite_id_indicateur_id_key
        unique (collectivite_id, indicateur_id, annee)
);

insert into public.indicateur_objectif_commentaire select * from archive.indicateur_objectif_commentaire;

-- indicateur_personnalise_definition;
create table public.indicateur_personnalise_definition
(
    id              serial
        primary key,
    collectivite_id integer                 not null
        references collectivite,
    titre           text                    not null,
    description     text                    not null,
    unite           text                    not null,
    commentaire     text                    not null,
    modified_by     uuid default auth.uid() not null
        references auth.users
)
    inherits (abstract_modified_at);

insert into public.indicateur_personnalise_definition select * from archive.indicateur_personnalise_definition;

-- indicateur_personnalise_resultat;
create table public.indicateur_personnalise_resultat
(
    collectivite_id integer not null
        references collectivite,
    indicateur_id   integer not null
        references indicateur_personnalise_definition,
    modified_by     uuid,
    primary key (indicateur_id, annee, collectivite_id)
)
    inherits (abstract_any_indicateur_value);

insert into public.indicateur_personnalise_resultat select * from archive.indicateur_personnalise_resultat;

-- indicateur_perso_resultat_commentaire;
create table public.indicateur_perso_resultat_commentaire
(
    collectivite_id integer                  not null
        references collectivite,
    indicateur_id   integer                  not null
        references indicateur_personnalise_definition,
    annee           integer                  not null,
    commentaire     text                     not null,
    modified_by     uuid                     not null
        references auth.users,
    modified_at     timestamp with time zone not null,
    constraint indicateur_perso_resultat_com_collectivite_id_indicateur_id_key
        unique (collectivite_id, indicateur_id, annee)
);

insert into public.indicateur_perso_resultat_commentaire select * from archive.indicateur_perso_resultat_commentaire;

-- indicateur_personnalise_objectif;
create table public.indicateur_personnalise_objectif
(
    collectivite_id integer not null
        references collectivite,
    indicateur_id   integer not null
        references indicateur_personnalise_definition,
    modified_by     uuid,
    primary key (indicateur_id, annee, collectivite_id)
)
    inherits (abstract_any_indicateur_value);

insert into public.indicateur_personnalise_objectif select * from archive.indicateur_personnalise_objectif;

-- indicateur_perso_objectif_commentaire;
create table public.indicateur_perso_objectif_commentaire
(
    collectivite_id integer                  not null
        references collectivite,
    indicateur_id   integer                  not null
        references indicateur_personnalise_definition,
    annee           integer                  not null,
    commentaire     text                     not null,
    modified_by     uuid                     not null
        references auth.users,
    modified_at     timestamp with time zone not null,
    constraint indicateur_perso_objectif_com_collectivite_id_indicateur_id_key
        unique (collectivite_id, indicateur_id, annee)
);

insert into public.indicateur_perso_objectif_commentaire select * from archive.indicateur_perso_objectif_commentaire;

-- fiche_action_indicateur
create table public.fiche_action_indicateur
(
    fiche_id                   integer not null
        references fiche_action,
    indicateur_id              indicateur_id
        references indicateur_definition,
    indicateur_personnalise_id integer
        references indicateur_personnalise_definition,
    constraint fiche_action_indicateur_fiche_id_indicateur_id_indicateur_p_key
        unique (fiche_id, indicateur_id, indicateur_personnalise_id)
);

insert into public.fiche_action_indicateur select * from archive.fiche_action_indicateur;

-- indicateur_pilote;
create table public.indicateur_pilote
(
    indicateur_id       indicateur_id default NULL::character varying
        references indicateur_definition,
    collectivite_id     integer
        references collectivite,
    user_id             uuid
        references auth.users,
    tag_id              integer
        references personne_tag
            on delete cascade,
    indicateur_perso_id integer
        references indicateur_personnalise_definition
            on delete cascade,
    constraint indicateur_pilote_indicateur_id_collectivite_id_user_id_tag_key
        unique (indicateur_id, indicateur_perso_id, collectivite_id, user_id, tag_id),
    constraint perso_ou_predefini
        check (((indicateur_id IS NOT NULL) AND (collectivite_id IS NOT NULL) AND (indicateur_perso_id IS NULL)) OR
               ((indicateur_perso_id IS NOT NULL) AND (indicateur_id IS NULL) AND (collectivite_id IS NULL))),
    constraint tag_ou_utilisateur
        check (((tag_id IS NOT NULL) AND (user_id IS NULL)) OR ((user_id IS NOT NULL) AND (tag_id IS NULL)))
);
comment on constraint perso_ou_predefini on indicateur_pilote is 'Vérifie que l''on référence un indicateur perso ou un indicateur prédéfini.';
comment on constraint tag_ou_utilisateur on indicateur_pilote is 'Vérifie que le pilote est un tag ou un utilisateur.';

insert into public.indicateur_pilote select * from archive.indicateur_pilote;

-- indicateur_service_tag;
create table public.indicateur_service_tag
(
    indicateur_id       indicateur_id default NULL::character varying
        references indicateur_definition,
    collectivite_id     integer
        references collectivite,
    service_tag_id      integer not null
        references service_tag
            on delete cascade,
    indicateur_perso_id integer
        constraint indicateur_service_tag_indicateur_personnalise_definition_id_fk
            references indicateur_personnalise_definition,
    constraint indicateur_service_tag_indicateur_collectivite_tag_key
        unique (indicateur_id, indicateur_perso_id, collectivite_id, service_tag_id),
    constraint perso_ou_predefini
        check (((indicateur_id IS NOT NULL) AND (collectivite_id IS NOT NULL) AND (indicateur_perso_id IS NULL)) OR
               ((indicateur_perso_id IS NOT NULL) AND (indicateur_id IS NULL) AND (collectivite_id IS NULL)))
);
comment on constraint perso_ou_predefini on indicateur_service_tag is 'Vérifie que l''on référence un indicateur perso ou un indicateur prédéfini.';

insert into public.indicateur_service_tag select * from archive.indicateur_service_tag;

-- indicateur_personnalise_thematique;
create table public.indicateur_personnalise_thematique
(
    indicateur_id integer not null
        references indicateur_personnalise_definition,
    thematique_id integer not null
        references thematique,
    primary key (indicateur_id, thematique_id)
);
insert into public.indicateur_personnalise_thematique select * from archive.indicateur_personnalise_thematique;

-- indicateur_confidentiel;
create table public.indicateur_confidentiel
(
    indicateur_id       text
        references indicateur_definition,
    indicateur_perso_id integer
        references indicateur_personnalise_definition,
    collectivite_id     integer
        references collectivite,
    constraint indicateur_confidentiel_indicateur_id_collectivite_id_indic_key
        unique (indicateur_id, collectivite_id, indicateur_perso_id),
    constraint perso_ou_predefini
        check (((indicateur_id IS NOT NULL) AND (collectivite_id IS NOT NULL) AND (indicateur_perso_id IS NULL)) OR
               ((indicateur_perso_id IS NOT NULL) AND (indicateur_id IS NULL) AND (collectivite_id IS NULL)))
);
comment on constraint perso_ou_predefini on indicateur_confidentiel is 'Vérifie que l''on référence un indicateur perso ou un indicateur prédéfini.';

insert into public.indicateur_confidentiel select * from archive.indicateur_confidentiel;

-- action_impact_indicateur
create table action_impact_indicateur
(
    action_impact_id integer       not null
        references action_impact,
    indicateur_id    indicateur_id not null
        references indicateur_definition,
    primary key (action_impact_id, indicateur_id)
);
insert into public.action_impact_indicateur select * from archive.action_impact_indicateur;


-- indicateur_terristory_json
create table public.indicateur_terristory_json
(
    indicateurs jsonb                                  not null
        constraint indicateur_terristory_json_indicateurs_check
            check (jsonb_matches_schema(schema => '{
              "type": "object",
              "properties": {
                "type": {"type":"string"},
                "contenu": {
                  "type":"array",
                  "items" : {
                    "type": "object",
                    "properties": {
                      "code": {"type":"string"},
                      "nom": {"type":"string"},
                      "x": {"type":"number"},
                      "y": {"type":"number"},
                      "val": {"type":"number"},
                      "confidentiel": {"type":"boolean"},
                      "annee": {"type":"string"}
                    },
                    "required" : ["code", "nom", "x", "y", "val", "confidentiel", "annee"],
                    "additionalProperties": false
                  }
                }
              },
              "required" : ["type", "contenu"],
              "additionalProperties": false
            }'::json, instance => indicateurs)),
    created_at  timestamp with time zone default now() not null
);


-- Supprime les copies dans archive
drop table archive.action_impact_indicateur;
drop table archive.fiche_action_indicateur;
drop table archive.indicateur_action;
drop table archive.indicateur_pilote;
drop table archive.indicateur_service_tag;
drop table archive.indicateur_personnalise_thematique;
drop table archive.indicateur_confidentiel;
drop table archive.indicateur_resultat;
drop table archive.indicateur_resultat_commentaire;
drop table archive.indicateur_resultat_import;
drop table archive.indicateur_objectif;
drop table archive.indicateur_objectif_commentaire;
drop table archive.indicateur_definition;
drop table archive.indicateur_personnalise_resultat;
drop table archive.indicateur_perso_resultat_commentaire;
drop table archive.indicateur_personnalise_objectif;
drop table archive.indicateur_perso_objectif_commentaire;
drop table archive.indicateur_personnalise_definition;

-- Recrée les éléments concernés
-- stats.report_indicateur_resultat;
create materialized view stats.report_indicateur_resultat as
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       ir.indicateur_id,
       ir.annee,
       ir.valeur
FROM stats.collectivite c
JOIN indicateur_resultat ir USING (collectivite_id)
WHERE ir.valeur IS NOT NULL
ORDER BY c.collectivite_id, ir.annee;

-- stats.report_indicateur_personnalise;
create materialized view stats.report_indicateur_personnalise as
SELECT ipd.collectivite_id,
       ipd.titre,
       ipd.description,
       ipd.unite,
       ipd.commentaire,
       count(ipo.*) AS objectifs,
       count(ipr.*) AS resultats
FROM indicateur_personnalise_definition ipd
LEFT JOIN indicateur_personnalise_objectif ipo ON ipd.id = ipo.indicateur_id
LEFT JOIN indicateur_personnalise_resultat ipr ON ipd.id = ipr.indicateur_id
WHERE ipo IS NOT NULL
   OR ipr IS NOT NULL
GROUP BY ipd.collectivite_id, ipd.titre, ipd.description, ipd.unite, ipd.commentaire;

-- stats.locales_evolution_resultat_indicateur_referentiel;
create materialized view stats.locales_evolution_resultat_indicateur_referentiel as
WITH resultats AS (
                  SELECT indicateur_resultat.collectivite_id,
                         collectivite.region_code,
                         collectivite.departement_code,
                         indicateur_resultat.modified_at
                  FROM indicateur_resultat
                  JOIN stats.collectivite USING (collectivite_id)
                  )
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
LEFT JOIN resultats i ON i.modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
JOIN stats.monthly_bucket m ON true
LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
JOIN stats.monthly_bucket m ON true
LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code
ORDER BY 1;

-- public.stats_locales_evolution_resultat_indicateur_referentiel;
create view public.stats_locales_evolution_resultat_indicateur_referentiel as
SELECT locales_evolution_resultat_indicateur_referentiel.mois,
       locales_evolution_resultat_indicateur_referentiel.code_region,
       locales_evolution_resultat_indicateur_referentiel.code_departement,
       locales_evolution_resultat_indicateur_referentiel.indicateurs
FROM stats.locales_evolution_resultat_indicateur_referentiel;

-- stats.locales_evolution_resultat_indicateur_personnalise;
create materialized view stats.locales_evolution_resultat_indicateur_personnalise as
WITH resultats AS (
                  SELECT indicateur_personnalise_resultat.collectivite_id,
                         collectivite.region_code,
                         collectivite.departement_code,
                         indicateur_personnalise_resultat.modified_at
                  FROM indicateur_personnalise_resultat
                  JOIN stats.collectivite USING (collectivite_id)
                  )
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
LEFT JOIN resultats i ON i.modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
JOIN stats.monthly_bucket m ON true
LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
JOIN stats.monthly_bucket m ON true
LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code
ORDER BY 1;

-- public.stats_locales_evolution_resultat_indicateur_personnalise;
create view public.stats_locales_evolution_resultat_indicateur_personnalise as
SELECT locales_evolution_resultat_indicateur_personnalise.mois,
       locales_evolution_resultat_indicateur_personnalise.code_region,
       locales_evolution_resultat_indicateur_personnalise.code_departement,
       locales_evolution_resultat_indicateur_personnalise.indicateurs
FROM stats.locales_evolution_resultat_indicateur_personnalise;

-- stats.locales_evolution_indicateur_referentiel;
create materialized view stats.locales_evolution_indicateur_referentiel as
WITH indicateurs AS (
                    SELECT indicateur_resultat.collectivite_id,
                           collectivite.region_code,
                           collectivite.departement_code,
                           indicateur_resultat.indicateur_id,
                           min(indicateur_resultat.modified_at) AS first_modified_at
                    FROM indicateur_resultat
                    JOIN stats.collectivite USING (collectivite_id)
                    GROUP BY indicateur_resultat.collectivite_id, collectivite.region_code,
                             collectivite.departement_code, indicateur_resultat.indicateur_id
                    )
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
JOIN stats.monthly_bucket m ON true
LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
JOIN stats.monthly_bucket m ON true
LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code;

-- public.stats_locales_evolution_indicateur_referentiel;
create view public.stats_locales_evolution_indicateur_referentiel as
SELECT locales_evolution_indicateur_referentiel.mois,
       locales_evolution_indicateur_referentiel.code_region,
       locales_evolution_indicateur_referentiel.code_departement,
       locales_evolution_indicateur_referentiel.indicateurs
FROM stats.locales_evolution_indicateur_referentiel;

-- stats.locales_evolution_collectivite_avec_indicateur_referentiel;
create materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel as
WITH indicateur_collectivite AS (
                                SELECT mb.first_day                                                               AS mois,
                                       c.collectivite_id,
                                       c.region_code,
                                       c.departement_code,
                                       COALESCE(count(*) FILTER (WHERE ir.modified_at <= mb.last_day),
                                                0::bigint)                                                        AS resultats
                                FROM stats.monthly_bucket mb
                                JOIN stats.collectivite c ON true
                                LEFT JOIN indicateur_resultat ir USING (collectivite_id)
                                GROUP BY mb.first_day, c.collectivite_id, c.departement_code, c.region_code
                                )
SELECT indicateur_collectivite.mois,
       NULL::character varying(2)                                    AS code_region,
       NULL::character varying(2)                                    AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois
UNION ALL
SELECT indicateur_collectivite.mois,
       indicateur_collectivite.region_code                           AS code_region,
       NULL::character varying                                       AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.region_code
UNION ALL
SELECT indicateur_collectivite.mois,
       NULL::character varying                                       AS code_region,
       indicateur_collectivite.departement_code                      AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.departement_code
ORDER BY 1;


-- public.stats_locales_evolution_collectivite_avec_indicateur;
create view public.stats_locales_evolution_collectivite_avec_indicateur as
SELECT locales_evolution_collectivite_avec_indicateur_referentiel.mois,
       locales_evolution_collectivite_avec_indicateur_referentiel.code_region,
       locales_evolution_collectivite_avec_indicateur_referentiel.code_departement,
       locales_evolution_collectivite_avec_indicateur_referentiel.collectivites
FROM stats.locales_evolution_collectivite_avec_indicateur_referentiel;

-- stats.evolution_resultat_indicateur_referentiel;
create materialized view stats.evolution_resultat_indicateur_referentiel as
SELECT m.first_day AS mois,
       count(*)    AS resultats
FROM stats.monthly_bucket m
LEFT JOIN indicateur_resultat ir ON ir.modified_at <= m.last_day
JOIN stats.collectivite_active USING (collectivite_id)
GROUP BY m.first_day
ORDER BY m.first_day;

-- public.stats_evolution_resultat_indicateur_referentiel;
create view public.stats_evolution_resultat_indicateur_referentiel as
SELECT evolution_resultat_indicateur_referentiel.mois,
       evolution_resultat_indicateur_referentiel.resultats
FROM stats.evolution_resultat_indicateur_referentiel;

-- stats.evolution_resultat_indicateur_personnalise;
create materialized view stats.evolution_resultat_indicateur_personnalise as
SELECT m.first_day AS mois,
       count(*)    AS resultats
FROM stats.monthly_bucket m
LEFT JOIN indicateur_personnalise_resultat ipr ON ipr.modified_at <= m.last_day
JOIN stats.collectivite_active USING (collectivite_id)
GROUP BY m.first_day
ORDER BY m.first_day;

-- public.stats_evolution_resultat_indicateur_personnalise;
create view public.stats_evolution_resultat_indicateur_personnalise as
SELECT evolution_resultat_indicateur_personnalise.mois,
       evolution_resultat_indicateur_personnalise.resultats
FROM stats.evolution_resultat_indicateur_personnalise;

-- stats.evolution_indicateur_referentiel;
create materialized view stats.evolution_indicateur_referentiel as
WITH indicateurs AS (
                    SELECT indicateur_resultat.collectivite_id,
                           indicateur_resultat.indicateur_id,
                           min(indicateur_resultat.modified_at) AS first_modified_at
                    FROM indicateur_resultat
                    JOIN stats.collectivite_active USING (collectivite_id)
                    GROUP BY indicateur_resultat.collectivite_id, indicateur_resultat.indicateur_id
                    )
SELECT m.first_day AS mois,
       count(*)    AS indicateurs
FROM stats.monthly_bucket m
LEFT JOIN indicateurs ON indicateurs.first_modified_at <= m.last_day
GROUP BY m.first_day
ORDER BY m.first_day;

-- public.stats_evolution_indicateur_referentiel;
create view public.stats_evolution_indicateur_referentiel as
SELECT evolution_indicateur_referentiel.mois,
       evolution_indicateur_referentiel.indicateurs
FROM stats.evolution_indicateur_referentiel;


-- public.indicateurs_collectivite;
create view public.indicateurs_collectivite  as
SELECT NULL::character varying      AS indicateur_id,
       ipd.id                       AS indicateur_personnalise_id,
       ipd.titre                    AS nom,
       ipd.description,
       ipd.unite,
       NULL::indicateur_programme[] AS programmes,
       ipd.collectivite_id
FROM indicateur_personnalise_definition ipd
WHERE can_read_acces_restreint(ipd.collectivite_id)
UNION
SELECT id.id         AS indicateur_id,
       NULL::integer AS indicateur_personnalise_id,
       id.nom,
       id.description,
       id.unite,
       id.programmes,
       NULL::integer AS collectivite_id
FROM indicateur_definition id;
comment on view indicateurs_collectivite is 'Liste les indicateurs (globaux et personnalisés) d''une collectivite';

-- public.indicateurs;
create view public.indicateurs as
SELECT 'resultat'::indicateur_valeur_type AS type,
       r.collectivite_id,
       r.indicateur_id,
       NULL::integer                      AS indicateur_perso_id,
       r.annee,
       r.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_resultat r
JOIN indicateur_definition d ON r.indicateur_id::text = d.id::text
LEFT JOIN indicateur_resultat_commentaire c
          ON r.indicateur_id::text = c.indicateur_id::text AND r.collectivite_id = c.collectivite_id AND
             r.annee = c.annee
WHERE can_read_acces_restreint(r.collectivite_id)
UNION ALL
SELECT 'resultat'::indicateur_valeur_type AS type,
       r.collectivite_id,
       alt.id                             AS indicateur_id,
       NULL::integer                      AS indicateur_perso_id,
       r.annee,
       r.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_resultat r
JOIN indicateur_definition alt ON r.indicateur_id::text = alt.valeur_indicateur::text
LEFT JOIN indicateur_confidentiel confidentiel
          ON r.indicateur_id::text = confidentiel.indicateur_id AND r.collectivite_id = confidentiel.collectivite_id
LEFT JOIN indicateur_resultat_commentaire c
          ON alt.id::text = c.indicateur_id::text AND r.collectivite_id = c.collectivite_id AND r.annee = c.annee
WHERE can_read_acces_restreint(r.collectivite_id)
UNION ALL
SELECT 'objectif'::indicateur_valeur_type AS type,
       o.collectivite_id,
       d.id                               AS indicateur_id,
       NULL::integer                      AS indicateur_perso_id,
       o.annee,
       o.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_objectif o
JOIN indicateur_definition d ON o.indicateur_id::text = d.id::text
LEFT JOIN indicateur_objectif_commentaire c
          ON o.indicateur_id::text = c.indicateur_id::text AND o.collectivite_id = c.collectivite_id AND
             o.annee = c.annee
WHERE can_read_acces_restreint(o.collectivite_id)
UNION ALL
SELECT 'objectif'::indicateur_valeur_type AS type,
       o.collectivite_id,
       alt.id                             AS indicateur_id,
       NULL::integer                      AS indicateur_perso_id,
       o.annee,
       o.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_objectif o
JOIN indicateur_definition alt ON o.indicateur_id::text = alt.valeur_indicateur::text
LEFT JOIN indicateur_objectif_commentaire c
          ON alt.id::text = c.indicateur_id::text AND o.collectivite_id = c.collectivite_id AND o.annee = c.annee
WHERE can_read_acces_restreint(o.collectivite_id)
UNION ALL
SELECT 'import'::indicateur_valeur_type AS type,
       indicateur_resultat_import.collectivite_id,
       indicateur_resultat_import.indicateur_id,
       NULL::integer                    AS indicateur_perso_id,
       indicateur_resultat_import.annee,
       indicateur_resultat_import.valeur,
       NULL::text                       AS commentaire,
       indicateur_resultat_import.source,
       indicateur_resultat_import.source_id
FROM indicateur_resultat_import
WHERE can_read_acces_restreint(indicateur_resultat_import.collectivite_id)
UNION ALL
SELECT 'import'::indicateur_valeur_type AS type,
       i.collectivite_id,
       alt.id                           AS indicateur_id,
       NULL::integer                    AS indicateur_perso_id,
       i.annee,
       i.valeur,
       NULL::text                       AS commentaire,
       i.source,
       i.source_id
FROM indicateur_resultat_import i
JOIN indicateur_definition alt ON i.indicateur_id::text = alt.valeur_indicateur::text
WHERE can_read_acces_restreint(i.collectivite_id)
UNION ALL
SELECT 'resultat'::indicateur_valeur_type AS type,
       r.collectivite_id,
       NULL::character varying            AS indicateur_id,
       r.indicateur_id                    AS indicateur_perso_id,
       r.annee,
       r.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_personnalise_resultat r
LEFT JOIN indicateur_perso_resultat_commentaire c USING (collectivite_id, indicateur_id, annee)
WHERE can_read_acces_restreint(r.collectivite_id)
UNION ALL
SELECT 'objectif'::indicateur_valeur_type AS type,
       r.collectivite_id,
       NULL::character varying            AS indicateur_id,
       r.indicateur_id                    AS indicateur_perso_id,
       r.annee,
       r.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_personnalise_objectif r
LEFT JOIN indicateur_perso_objectif_commentaire c USING (collectivite_id, indicateur_id, annee)
WHERE can_read_acces_restreint(r.collectivite_id);

-- public.indicateur_rempli;
create view public.indicateur_rempli as
SELECT i.indicateur_id,
       NULL::integer       AS perso_id,
       i.collectivite_id,
       count(i.valeur) > 0 AS rempli
FROM (SELECT ir.indicateur_id,
             ir.collectivite_id,
             ir.valeur
      FROM indicateur_resultat ir
      UNION ALL
      SELECT indicateur_resultat_import.indicateur_id,
             indicateur_resultat_import.collectivite_id,
             indicateur_resultat_import.valeur
      FROM indicateur_resultat_import) i
GROUP BY i.indicateur_id, i.collectivite_id
UNION ALL
SELECT alt.id              AS indicateur_id,
       NULL::integer       AS perso_id,
       i.collectivite_id,
       count(i.valeur) > 0 AS rempli
FROM (SELECT ir.indicateur_id,
             ir.collectivite_id,
             ir.valeur
      FROM indicateur_resultat ir
      UNION ALL
      SELECT indicateur_resultat_import.indicateur_id,
             indicateur_resultat_import.collectivite_id,
             indicateur_resultat_import.valeur
      FROM indicateur_resultat_import) i
JOIN indicateur_definition alt ON alt.valeur_indicateur::text = i.indicateur_id::text
GROUP BY alt.id, i.collectivite_id
UNION ALL
SELECT NULL::character varying AS indicateur_id,
       ipr.indicateur_id       AS perso_id,
       ipr.collectivite_id,
       count(ipr.valeur) > 0   AS rempli
FROM indicateur_personnalise_resultat ipr
GROUP BY ipr.indicateur_id, ipr.collectivite_id;
comment on view indicateur_rempli is 'Permet de filtrer les indicateurs par remplissage.';
comment on column indicateur_rempli.rempli is 'Vrai si un résultat a été saisi.';


-- public.indicateur_definitions;
create view public.indicateur_definitions as
SELECT c.id          AS collectivite_id,
       definition.id AS indicateur_id,
       NULL::integer AS indicateur_perso_id,
       definition.nom,
       definition.description,
       definition.unite
FROM collectivite c
CROSS JOIN indicateur_definition definition
WHERE is_authenticated()
UNION ALL
SELECT definition.collectivite_id,
       NULL::character varying::indicateur_id AS indicateur_id,
       definition.id                          AS indicateur_perso_id,
       definition.titre                       AS nom,
       definition.description,
       definition.unite
FROM indicateur_personnalise_definition definition
WHERE can_read_acces_restreint(definition.collectivite_id);
comment on view indicateur_definitions is 'Les définitions des indicateurs prédéfinis et personnalisés';

-- private.fiches_action;
create view private.fiches_action as
SELECT fa.modified_at,
       fa.id,
       fa.titre,
       fa.description,
       fa.piliers_eci,
       fa.objectifs,
       fa.resultats_attendus,
       fa.cibles,
       fa.ressources,
       fa.financements,
       fa.budget_previsionnel,
       fa.statut,
       fa.niveau_priorite,
       fa.date_debut,
       fa.date_fin_provisoire,
       fa.amelioration_continue,
       fa.calendrier,
       fa.notes_complementaires,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       fa.modified_by,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              FROM fiche_action_pilote fap
              LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
              LEFT JOIN dcp ON fap.user_id = dcp.user_id
              WHERE fap.fiche_id = fa.id) pil)  AS pilotes,
       (SELECT array_agg(ROW (ref.nom, ref.collectivite_id, ref.tag_id, ref.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     far.tag_id,
                     far.user_id
              FROM fiche_action_referent far
              LEFT JOIN personne_tag pt ON far.tag_id = pt.id
              LEFT JOIN dcp ON far.user_id = dcp.user_id
              WHERE far.fiche_id = fa.id) ref)  AS referents,
       pla.axes,
       act.actions,
       (SELECT array_agg(ROW (indi.indicateur_id, indi.indicateur_personnalise_id, indi.nom, indi.description, indi.unite)::indicateur_generique) AS array_agg
        FROM (SELECT fai.indicateur_id,
                     fai.indicateur_personnalise_id,
                     COALESCE(id.nom, ipd.titre)               AS nom,
                     COALESCE(id.description, ipd.description) AS description,
                     COALESCE(id.unite, ipd.unite)             AS unite
              FROM fiche_action_indicateur fai
              LEFT JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
              LEFT JOIN indicateur_personnalise_definition ipd ON fai.indicateur_personnalise_id = ipd.id
              WHERE fai.fiche_id = fa.id) indi) AS indicateurs,
       ser.services,
       (SELECT array_agg(ROW (fin.financeur_tag, fin.montant_ttc, fin.id)::financeur_montant) AS financeurs
        FROM (SELECT ft.*::financeur_tag AS financeur_tag,
                     faft.montant_ttc,
                     faft.id
              FROM financeur_tag ft
              JOIN fiche_action_financeur_tag faft ON ft.id = faft.financeur_tag_id
              WHERE faft.fiche_id = fa.id) fin) AS financeurs,
       fic.fiches_liees,
       fa.restreint
FROM fiche_action fa
LEFT JOIN (SELECT fath.fiche_id,
                  array_agg(th.*) AS thematiques
           FROM thematique th
           JOIN fiche_action_thematique fath ON fath.thematique_id = th.id
           GROUP BY fath.fiche_id) t ON t.fiche_id = fa.id
LEFT JOIN (SELECT fasth.fiche_id,
                  array_agg(sth.*) AS sous_thematiques
           FROM sous_thematique sth
           JOIN fiche_action_sous_thematique fasth ON fasth.thematique_id = sth.id
           GROUP BY fasth.fiche_id) st ON st.fiche_id = fa.id
LEFT JOIN (SELECT fapt.fiche_id,
                  array_agg(pt.*) AS partenaires
           FROM partenaire_tag pt
           JOIN fiche_action_partenaire_tag fapt ON fapt.partenaire_tag_id = pt.id
           GROUP BY fapt.fiche_id) p ON p.fiche_id = fa.id
LEFT JOIN (SELECT fast.fiche_id,
                  array_agg(st_1.*) AS structures
           FROM structure_tag st_1
           JOIN fiche_action_structure_tag fast ON fast.structure_tag_id = st_1.id
           GROUP BY fast.fiche_id) s ON s.fiche_id = fa.id
LEFT JOIN (SELECT fapa.fiche_id,
                  array_agg(pa.*) AS axes
           FROM axe pa
           JOIN fiche_action_axe fapa ON fapa.axe_id = pa.id
           GROUP BY fapa.fiche_id) pla ON pla.fiche_id = fa.id
LEFT JOIN (SELECT faa.fiche_id,
                  array_agg(ar.*) AS actions
           FROM action_relation ar
           JOIN fiche_action_action faa ON faa.action_id::text = ar.id::text
           GROUP BY faa.fiche_id) act ON act.fiche_id = fa.id
LEFT JOIN (SELECT fast.fiche_id,
                  array_agg(st_1.*) AS services
           FROM service_tag st_1
           JOIN fiche_action_service_tag fast ON fast.service_tag_id = st_1.id
           GROUP BY fast.fiche_id) ser ON ser.fiche_id = fa.id
LEFT JOIN (SELECT falpf.fiche_id,
                  array_agg(fr.*) AS fiches_liees
           FROM private.fiche_resume fr
           JOIN fiches_liees_par_fiche falpf ON falpf.fiche_liee_id = fr.id
           GROUP BY falpf.fiche_id) fic ON fic.fiche_id = fa.id;


-- public.fiches_action;
create view public.fiches_action as
SELECT fiches_action.modified_at,
       fiches_action.id,
       fiches_action.titre,
       fiches_action.description,
       fiches_action.piliers_eci,
       fiches_action.objectifs,
       fiches_action.resultats_attendus,
       fiches_action.cibles,
       fiches_action.ressources,
       fiches_action.financements,
       fiches_action.budget_previsionnel,
       fiches_action.statut,
       fiches_action.niveau_priorite,
       fiches_action.date_debut,
       fiches_action.date_fin_provisoire,
       fiches_action.amelioration_continue,
       fiches_action.calendrier,
       fiches_action.notes_complementaires,
       fiches_action.maj_termine,
       fiches_action.collectivite_id,
       fiches_action.created_at,
       fiches_action.modified_by,
       fiches_action.thematiques,
       fiches_action.sous_thematiques,
       fiches_action.partenaires,
       fiches_action.structures,
       fiches_action.pilotes,
       fiches_action.referents,
       fiches_action.axes,
       fiches_action.actions,
       fiches_action.indicateurs,
       fiches_action.services,
       fiches_action.financeurs,
       fiches_action.fiches_liees,
       fiches_action.restreint
FROM private.fiches_action
WHERE CASE
          WHEN fiches_action.restreint = true THEN have_lecture_acces(fiches_action.collectivite_id) OR est_support()
          ELSE can_read_acces_restreint(fiches_action.collectivite_id)
      END;

-- stats.crm_usages;
create materialized view stats.crm_usages as
WITH premier_rattachements AS (
                              SELECT private_utilisateur_droit.collectivite_id,
                                     min(private_utilisateur_droit.created_at)::date AS date
                              FROM private_utilisateur_droit
                              WHERE private_utilisateur_droit.active
                              GROUP BY private_utilisateur_droit.collectivite_id
                              ),
     comptes AS (
                              SELECT c_1.collectivite_id,
                                     (
                                     SELECT count(*) AS count
                                     FROM fiche_action x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                     ) AS fiches,
                                     (
                                     SELECT count(*) AS count
                                     FROM axe x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                       AND x_1.parent IS NULL
                                     ) AS plans,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_resultat x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                     ) AS resultats_indicateurs,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_personnalise_definition x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                     ) AS indicateurs_perso,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_personnalise_resultat x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                     ) AS resultats_indicateurs_perso
                              FROM stats.collectivite c_1
                              )
SELECT c.collectivite_id,
       ((c.nom::text || ' ('::text) || c.collectivite_id) || ')'::text AS key,
       pc.completude_eci,
       pc.completude_cae,
       x.fiches,
       x.plans,
       x.resultats_indicateurs,
       x.indicateurs_perso,
       x.resultats_indicateurs_perso,
       pr.date                                                         AS premier_rattachement,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.titre IS NOT NULL
         AND (f.description IS NOT NULL OR f.objectifs IS NOT NULL)
       )                                                               AS fiches_initiees,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_debut IS NOT NULL OR
              f.date_fin_provisoire IS NOT NULL OR (f.id IN (
                                                            SELECT fiche_action_structure_tag.fiche_id
                                                            FROM fiche_action_structure_tag
                                                            )) OR (f.id IN (
                                                                           SELECT st.fiche_id
                                                                           FROM fiche_action_pilote st
                                                                           )) OR (f.id IN (
                                                                                          SELECT fiche_action_service_tag.fiche_id
                                                                                          FROM fiche_action_service_tag
                                                                                          )))
       )                                                               AS fiches_pilotage,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiche_action_indicateur.fiche_id
                      FROM fiche_action_indicateur
                      ))
       )                                                               AS fiches_indicateur,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiche_action_action.fiche_id
                      FROM fiche_action_action
                      ))
       )                                                               AS fiches_action_referentiel,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiches_liees_par_fiche.fiche_id
                      FROM fiches_liees_par_fiche
                      ))
       )                                                               AS fiches_fiche_liee,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '1 mon'::interval)
       )                                                               AS fiches_mod_1mois,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '3 mons'::interval)
       )                                                               AS fiches_mod_3mois,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS fiches_mod_6mois,
       (
       SELECT min(f.created_at) AS min
       FROM (
            SELECT p.created_at,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND p.nom IS NOT NULL
            GROUP BY p.id, p.created_at
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_date_creation,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '1 mon'::interval)
       )                                                               AS pa_view_1mois,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '3 mons'::interval)
       )                                                               AS pa_view_3mois,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS pa_view_6mois,
       (
       SELECT count(*) AS count
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_non_vides,
       (
       SELECT count(*) AS count
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_pilote fap ON f_1.id = fap.fiche_id
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND f_1.statut IS NOT NULL
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_pilotables,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
       )                                                               AS fiches_non_vides,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
         AND f.statut IS NOT NULL
       )                                                               AS fiches_pilotables,
       (
       SELECT count(*) > 4
       FROM fiche_action f
       LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
         AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_fin_provisoire IS NOT NULL OR
              fap.* IS NOT NULL)
       )                                                               AS _5fiches_1pilotage,
       (
       SELECT count(*) AS count
       FROM historique.fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.previous_statut <> f.statut OR f.previous_statut IS NULL AND f.statut IS NOT NULL OR
              f.previous_statut IS NOT NULL AND f.statut IS NULL)
         AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS fiches_changement_statut,
       CASE
           WHEN x.fiches = 0 THEN 0::numeric
           ELSE ((
                 SELECT count(*) AS count
                 FROM fiche_action f
                 WHERE f.collectivite_id = c.collectivite_id
                   AND f.restreint = true
                 )
                )::numeric / x.fiches::numeric * 100::numeric
       END                                                             AS pourcentage_fa_privee,
       CASE
           WHEN x.fiches = 0 THEN 0::numeric
           ELSE ((
                 SELECT count(*) AS count
                 FROM fiche_action f
                 JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
                 WHERE f.collectivite_id = c.collectivite_id
                   AND f.restreint = true
                   AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
                   AND f.statut IS NOT NULL
                 )
                )::numeric / x.fiches::numeric * 100::numeric
       END                                                             AS pourcentage_fa_pilotable_privee,
       (
       SELECT count(ic.*) AS count
       FROM indicateur_confidentiel ic
       WHERE ic.collectivite_id = c.collectivite_id
       )                                                               AS indicateur_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_confidentiel ic
       WHERE ic.collectivite_id = c.collectivite_id
       )                                                               AS min1_indicateur_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_confidentiel ic
       WHERE ic.collectivite_id = c.collectivite_id
         AND ic.indicateur_id IS NOT NULL
       )                                                               AS min1_indicateur_predef_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_confidentiel ic
       WHERE ic.collectivite_id = c.collectivite_id
         AND ic.indicateur_perso_id IS NOT NULL
       )                                                               AS min1_indicateur_perso_prive,
       (
       SELECT i.pourcentage
       FROM (
            SELECT c_1.id                                                                      AS collectivite_id,
                   case when (
                             SELECT count(*) AS count
                             FROM indicateur_definition
                             ) = 0 then 0::double precision
                        else
                            count(ic.*)::double precision / ((
                                                             SELECT count(*) AS count
                                                             FROM indicateur_definition
                                                             )
                                                            )::double precision * 100::double precision end AS pourcentage
            FROM collectivite c_1
            LEFT JOIN indicateur_confidentiel ic ON ic.collectivite_id = c_1.id AND ic.indicateur_id IS NOT NULL
            GROUP BY c_1.id
            ) i
       WHERE i.collectivite_id = c.collectivite_id
       )                                                               AS pourcentage_indicateur_predef_prives,
       (
       SELECT array_agg(DISTINCT pat.type) AS array_agg
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_pilote fap ON f_1.id = fap.fiche_id
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a_1 ON a_1.id = faa.axe_id
            JOIN axe p ON a_1.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND f_1.statut IS NOT NULL
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       JOIN axe a ON f.id = a.id
       LEFT JOIN plan_action_type pat ON a.type = pat.id
       WHERE f.nb_fiche > 4
       )                                                               AS type_pa
FROM stats.collectivite c
JOIN stats.collectivite_active USING (collectivite_id)
LEFT JOIN comptes x USING (collectivite_id)
LEFT JOIN stats.pourcentage_completude pc USING (collectivite_id)
LEFT JOIN premier_rattachements pr USING (collectivite_id)
ORDER BY c.nom;
comment on column stats.crm_usages.pa_date_creation is 'Date de création du premier plan (avec +5 FA non vides) pour chaque collectivité concernées';
comment on column stats.crm_usages.pa_view_1mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours du mois dernier';
comment on column stats.crm_usages.pa_view_3mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours des 3 derniers mois';
comment on column stats.crm_usages.pa_view_6mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours des 6 derniers mois.';
comment on column stats.crm_usages.pa_non_vides is 'Nombre de plans non vides (minimum un titre de PA et 5 FA non vides)';
comment on column stats.crm_usages.pa_pilotables is 'Nombre de plans “pilotables” (= avec min. 5 FA, qui ont à minima, le titre, le pilote et le statut renseigné)';
comment on column stats.crm_usages.fiches_non_vides is 'Nombre de fiches actions non vides';
comment on column stats.crm_usages.fiches_pilotables is 'Nombre de fiches actions pilotables ( = à minima le titre, le pilote et le statut renseigné)';
comment on column stats.crm_usages._5fiches_1pilotage is 'Nombre de collectivités qui ont au moins 5 FA avec au moins le titre + 1 critère de pilotage renseigné (soit statut ou priorité ou date prévisionnelle ou responsable)';
comment on column stats.crm_usages.fiches_changement_statut is 'Nombre de changements de statut de fiches actions dans les 6 derniers mois par collectivité (tous les status)';
comment on column stats.crm_usages.pourcentage_fa_privee is '% de fiches action privées par collectivité';
comment on column stats.crm_usages.pourcentage_fa_pilotable_privee is '% de fiches action pilotables privées (avec au moins un titre rempli, le pilote et le statut)';
comment on column stats.crm_usages.indicateur_prive is 'Nombre d''indicateurs privés par collectivité';
comment on column stats.crm_usages.min1_indicateur_prive is 'Vrai si au moins un indicateur privé';
comment on column stats.crm_usages.min1_indicateur_predef_prive is 'Vrai si au moins un indicateur prédéfini privé';
comment on column stats.crm_usages.min1_indicateur_perso_prive is 'Vrai si au moins un indicateur perso privé';
comment on column stats.crm_usages.pourcentage_indicateur_predef_prives is '% d''indicateur prédéfini privé par collectivité';
comment on column stats.crm_usages.type_pa is 'Liste de tous les types des plans pilotables de la collectivité';


-- public.crm_usages;
create view public.crm_usages as
SELECT crm_usages.collectivite_id,
       crm_usages.key,
       crm_usages.completude_eci,
       crm_usages.completude_cae,
       crm_usages.fiches,
       crm_usages.plans,
       crm_usages.resultats_indicateurs,
       crm_usages.indicateurs_perso,
       crm_usages.resultats_indicateurs_perso,
       crm_usages.premier_rattachement,
       crm_usages.fiches_initiees,
       crm_usages.fiches_pilotage,
       crm_usages.fiches_indicateur,
       crm_usages.fiches_action_referentiel,
       crm_usages.fiches_fiche_liee,
       crm_usages.fiches_mod_1mois,
       crm_usages.fiches_mod_3mois,
       crm_usages.fiches_mod_6mois,
       crm_usages.pa_date_creation,
       crm_usages.pa_view_1mois,
       crm_usages.pa_view_3mois,
       crm_usages.pa_view_6mois,
       crm_usages.pa_non_vides,
       crm_usages.pa_pilotables,
       crm_usages.fiches_non_vides,
       crm_usages.fiches_pilotables,
       crm_usages._5fiches_1pilotage,
       crm_usages.fiches_changement_statut,
       crm_usages.pourcentage_fa_privee,
       crm_usages.pourcentage_fa_pilotable_privee,
       crm_usages.indicateur_prive,
       crm_usages.min1_indicateur_prive,
       crm_usages.min1_indicateur_predef_prive,
       crm_usages.min1_indicateur_perso_prive,
       crm_usages.pourcentage_indicateur_predef_prives,
       crm_usages.type_pa
FROM stats.crm_usages
WHERE is_service_role();

-- stats.crm_indicateurs;
create materialized view stats.crm_indicateurs as
SELECT i.id,
       id.nom,
       i.nb_prive,
       i.nb_prive::double precision / ((
                                       SELECT count(*) AS count
                                       FROM indicateur_definition
                                       )
                                      )::double precision * 100::double precision AS pourcentage_prive
FROM (
     SELECT id_1.id,
            count(ic.*) AS nb_prive
     FROM indicateur_definition id_1
     LEFT JOIN indicateur_confidentiel ic ON id_1.id::text = ic.indicateur_id
     GROUP BY id_1.id
     ) i
JOIN indicateur_definition id ON i.id::text = id.id::text
ORDER BY i.nb_prive DESC;

-- public.crm_indicateurs;
create view public.crm_indicateurs as
SELECT crm_indicateurs.id,
       crm_indicateurs.nom,
       crm_indicateurs.nb_prive,
       crm_indicateurs.pourcentage_prive
FROM stats.crm_indicateurs
WHERE is_service_role();

-- private.get_personne(indicateur_pilote);
create function private.get_personne(indicateur_pilote) returns personne
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT
    CASE
        WHEN (($1).tag_id IS NOT NULL) THEN ( SELECT ROW(pt.nom, pt.collectivite_id, ($1).tag_id, NULL::uuid)::personne AS "row"
                                              FROM personne_tag pt
                                              WHERE (pt.id = ($1).tag_id))
        ELSE ( SELECT ROW(((u.prenom || ' '::text) || u.nom), ($1).collectivite_id, NULL::integer, u.user_id)::personne AS "row"
               FROM utilisateur.dcp_display u
               WHERE (u.user_id = ($1).user_id))
    END AS "row";
END;
comment on function private.get_personne(indicateur_pilote) is 'Renvoie la personne pilote d''un indicateur.';

-- private.can_write(indicateur_service_tag);
create function private.can_write(indicateur_service_tag) returns boolean
    language sql
BEGIN ATOMIC
SELECT
    CASE
        WHEN (($1).indicateur_id IS NOT NULL) THEN (have_edition_acces(($1).collectivite_id) OR private.est_auditeur(($1).collectivite_id))
        ELSE (have_edition_acces(( SELECT d.collectivite_id
                                   FROM indicateur_personnalise_definition d
                                   WHERE (d.id = ($1).indicateur_perso_id))) OR private.est_auditeur(( SELECT d.collectivite_id
                                                                                                       FROM indicateur_personnalise_definition d
                                                                                                       WHERE (d.id = ($1).indicateur_perso_id))))
    END AS "case";
END;
comment on function private.can_write(indicateur_service_tag) is 'Vrai si l''utilisateur peut écrire un `indicateur_service_tag`.';

-- private.can_read(indicateur_service_tag);
create function private.can_read(indicateur_service_tag) returns boolean
    language sql
BEGIN ATOMIC
SELECT
    CASE
        WHEN (($1).indicateur_id IS NOT NULL) THEN can_read_acces_restreint(($1).collectivite_id)
        ELSE can_read_acces_restreint(( SELECT d.collectivite_id
                                        FROM indicateur_personnalise_definition d
                                        WHERE (d.id = ($1).indicateur_perso_id)))
    END AS can_read_acces_restreint;
END;
comment on function private.can_read(indicateur_service_tag) is 'Vrai si l''utilisateur peut lire un `indicateur_service_tag`.';

-- private.can_write(indicateur_confidentiel);
create function private.can_write(indicateur_confidentiel) returns boolean
    language sql
BEGIN ATOMIC
SELECT
    CASE
        WHEN (($1).indicateur_id IS NOT NULL) THEN (have_edition_acces(($1).collectivite_id) OR private.est_auditeur(($1).collectivite_id))
        ELSE (have_edition_acces(( SELECT d.collectivite_id
                                   FROM indicateur_personnalise_definition d
                                   WHERE (d.id = ($1).indicateur_perso_id))) OR private.est_auditeur(( SELECT d.collectivite_id
                                                                                                       FROM indicateur_personnalise_definition d
                                                                                                       WHERE (d.id = ($1).indicateur_perso_id))))
    END AS "case";
END;
comment on function private.can_write(indicateur_confidentiel) is 'Vrai si l''utilisateur peut écrire un `indicateur_confidentiel`.';


-- private.can_read(indicateur_confidentiel);
create function private.can_read(indicateur_confidentiel) returns boolean
    language sql
BEGIN ATOMIC
SELECT
    CASE
        WHEN (($1).indicateur_id IS NOT NULL) THEN can_read_acces_restreint(($1).collectivite_id)
        ELSE can_read_acces_restreint(( SELECT d.collectivite_id
                                        FROM indicateur_personnalise_definition d
                                        WHERE (d.id = ($1).indicateur_perso_id)))
    END AS can_read_acces_restreint;
END;
comment on function private.can_read(indicateur_confidentiel) is 'Vrai si l''utilisateur peut lire un `indicateur_confidentiel`.';

-- private.can_write(indicateur_pilote);
create function private.can_write(indicateur_pilote) returns boolean
    language sql
BEGIN ATOMIC
SELECT
    CASE
        WHEN (($1).indicateur_id IS NOT NULL) THEN (have_edition_acces(($1).collectivite_id) OR private.est_auditeur(($1).collectivite_id))
        ELSE (have_edition_acces(( SELECT d.collectivite_id
                                   FROM indicateur_personnalise_definition d
                                   WHERE (d.id = ($1).indicateur_perso_id))) OR private.est_auditeur(( SELECT d.collectivite_id
                                                                                                       FROM indicateur_personnalise_definition d
                                                                                                       WHERE (d.id = ($1).indicateur_perso_id))))
    END AS "case";
END;
comment on function private.can_write(indicateur_pilote) is 'Vrai si l''utilisateur peut écrire un `indicateur_pilote`.';

-- private.can_read(indicateur_pilote);
create function private.can_read(indicateur_pilote) returns boolean
    language sql
BEGIN ATOMIC
SELECT
    CASE
        WHEN (($1).indicateur_id IS NOT NULL) THEN can_read_acces_restreint(($1).collectivite_id)
        ELSE can_read_acces_restreint(( SELECT d.collectivite_id
                                        FROM indicateur_personnalise_definition d
                                        WHERE (d.id = ($1).indicateur_perso_id)))
    END AS can_read_acces_restreint;
END;
comment on function private.can_read(indicateur_pilote) is 'Vrai si l''utilisateur peut lire un `indicateur_pilote`.';

-- public.definition_referentiel;
create function public.definition_referentiel(indicateur_definitions) returns SETOF indicateur_definition
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT ist.*::indicateur_definition AS ist
FROM indicateur_definition ist
WHERE (((ist.id)::text = (($1).indicateur_id)::text) AND is_authenticated());
END;
comment on function public.definition_referentiel(indicateur_definitions) is 'La définition de l''indicateur provenant du référentiel.';


-- stats.refresh_views_crm;
create function stats.refresh_views_crm() returns void
    security definer
    language plpgsql
as
$$
begin
    refresh materialized view stats.crm_usages;
    refresh materialized view stats.crm_indicateurs;
    refresh materialized view stats.crm_plans;
end ;
$$;

-- stats.refresh_views;
create function stats.refresh_views() returns void
    security definer
    language plpgsql
as
$$
begin
    refresh materialized view stats.collectivite;
    refresh materialized view stats.collectivite_utilisateur;
    refresh materialized view stats.collectivite_referentiel;
    refresh materialized view stats.collectivite_labellisation;
    refresh materialized view stats.collectivite_plan_action;
    refresh materialized view stats.collectivite_action_statut;
    refresh materialized view stats.evolution_activation;
    refresh materialized view stats.rattachement;
    refresh materialized view stats.utilisateur;
    refresh materialized view stats.evolution_utilisateur;
    refresh materialized view stats.connection;
    refresh materialized view stats.evolution_connection;
    refresh materialized view stats.carte_collectivite_active;
    refresh materialized view stats.evolution_total_activation_par_type;
    refresh materialized view stats.collectivite_actives_et_total_par_type;
    refresh materialized view stats.evolution_nombre_utilisateur_par_collectivite;
    refresh materialized view stats.carte_epci_par_departement;
    refresh materialized view stats.pourcentage_completude;
    refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
    refresh materialized view stats.evolution_indicateur_referentiel;
    refresh materialized view stats.evolution_resultat_indicateur_referentiel;
    refresh materialized view stats.evolution_resultat_indicateur_personnalise;
    refresh materialized view stats.engagement_collectivite;
    refresh materialized view stats.evolution_nombre_fiches;
    refresh materialized view stats.evolution_nombre_plans;
    refresh materialized view stats.evolution_nombre_labellisations;
end ;
$$;

-- stats.refresh_reporting;
create function stats.refresh_reporting() returns void
    language plpgsql
as
$$
begin
    refresh materialized view stats.report_scores;
    refresh materialized view stats.report_reponse_choix;
    refresh materialized view stats.report_reponse_binaire;
    refresh materialized view stats.report_reponse_proportion;
    refresh materialized view stats.report_indicateur_resultat;
    refresh materialized view stats.report_indicateur_personnalise;
end;
$$;
comment on function stats.refresh_reporting() is 'Rafraichit les vues matérialisées.';

-- private.upsert_indicateurs;
create function private.upsert_indicateurs(indicateurs jsonb) returns void
    security definer
    language plpgsql
as
$$
declare
    indicateur jsonb;
begin
    -- on utilise une table temporaire pour ne pas avoir les contraintes sur les `valeur_indicateur`
    create temporary table definition
    (
        like indicateur_definition
    ) on commit drop;

    for indicateur in select * from jsonb_array_elements(indicateurs)
        loop
            insert into definition
            (id, identifiant, valeur_indicateur, nom, description, unite,
             parent, participation_score, selection, sans_valeur, source, titre_long, type,
             thematiques, programmes, modified_at)
            values ((indicateur ->> 'id')::indicateur_id,
                    indicateur ->> 'identifiant',
                    (indicateur ->> 'valeur_indicateur')::indicateur_id,
                    indicateur ->> 'nom',
                    indicateur ->> 'description',
                    indicateur ->> 'unite',
                    indicateur ->> 'parent',
                    (indicateur -> 'participation_score')::bool,
                    (indicateur -> 'selection')::bool,
                    (indicateur -> 'sans_valeur')::bool,
                    indicateur ->> 'source',
                    indicateur ->> 'titre_long',
                    (indicateur ->> 'type')::indicateur_referentiel_type,
                    (select array(
                                    select jsonb_array_elements_text((indicateur -> 'thematiques'))
                            )::indicateur_thematique[]),
                    (select array(
                                    select jsonb_array_elements_text((indicateur -> 'programmes'))
                            )::indicateur_programme[]),
                    now());
        end loop;

    -- on commence par insérer les définitions sans parents
    insert into indicateur_definition
    select *
    from definition
    where parent is null
      and valeur_indicateur is null
    on conflict (id) do update
        set identifiant         = excluded.identifiant,
            valeur_indicateur   = excluded.valeur_indicateur,
            nom                 = excluded.nom,
            description         = excluded.description,
            unite               = excluded.unite,
            parent              = excluded.parent,
            participation_score = excluded.participation_score,
            selection           = excluded.selection,
            sans_valeur         = excluded.sans_valeur,
            source              = excluded.source,
            titre_long          = excluded.titre_long,
            type                = excluded.type,
            thematiques         = excluded.thematiques,
            programmes          = excluded.programmes,
            modified_at         = excluded.modified_at;

    -- puis le reste
    insert into indicateur_definition
    select *
    from definition
    where not (parent is null and valeur_indicateur is null)
    on conflict (id) do update
        set identifiant         = excluded.identifiant,
            valeur_indicateur   = excluded.valeur_indicateur,
            nom                 = excluded.nom,
            description         = excluded.description,
            unite               = excluded.unite,
            parent              = excluded.parent,
            participation_score = excluded.participation_score,
            selection           = excluded.selection,
            sans_valeur         = excluded.sans_valeur,
            source              = excluded.source,
            titre_long          = excluded.titre_long,
            type                = excluded.type,
            thematiques         = excluded.thematiques,
            programmes          = excluded.programmes,
            modified_at         = excluded.modified_at;

    -- les liens entre indicateur et action
    for indicateur in select * from jsonb_array_elements(indicateurs)
        loop
            if indicateur -> 'action_ids' != 'null'
            then
                --- insert les liens
                insert into indicateur_action (indicateur_id, action_id)
                select indicateur ->> 'id',
                       jsonb_array_elements_text(indicateur -> 'action_ids')::action_id
                on conflict (indicateur_id, action_id) do nothing;
                --- enlève les liens qui n'existent plus
                delete
                from indicateur_action ia
                where ia.indicateur_id = (indicateur ->> 'id')::indicateur_id
                  and ia.action_id not in
                      (select id::action_id from jsonb_array_elements_text(indicateur -> 'action_ids') as id);
            end if;
        end loop;
end ;
$$;
comment on function private.upsert_indicateurs(jsonb) is 'Mets à jour les définitions des indicateurs ansi que les liens avec les actions.';

-- private.upsert_indicateurs_after_json_insert;
create function private.upsert_indicateurs_after_json_insert() returns trigger
    language plpgsql
as
$$
declare
begin
    perform private.upsert_indicateurs(new.indicateurs);
    return new;
end;
$$;

-- trigger after_indicateurs_json on indicateurs_json;
create trigger after_indicateurs_json
    after insert
    on public.indicateurs_json
    for each row
execute procedure private.upsert_indicateurs_after_json_insert();


-- private.rempli(integer, indicateur_id);
create function private.rempli(collectivite_id integer, indicateur_id indicateur_id) returns boolean
    stable
    security definer
    language sql
BEGIN ATOMIC
WITH remplissage AS (
                    SELECT (count(ir.valeur) > 0) AS rempli
                    FROM indicateur_resultat ir
                    WHERE ((ir.collectivite_id = rempli.collectivite_id) AND ((ir.indicateur_id)::text = (rempli.indicateur_id)::text) AND (ir.valeur IS NOT NULL))
                    UNION
                    SELECT (count(ir.valeur) > 0) AS rempli
                    FROM (indicateur_resultat ir
                        JOIN indicateur_definition def ON (((ir.indicateur_id)::text = (def.valeur_indicateur)::text)))
                    WHERE ((ir.collectivite_id = rempli.collectivite_id) AND ((def.id)::text = (rempli.indicateur_id)::text) AND (ir.valeur IS NOT NULL))
                    UNION
                    SELECT (count(iri.valeur) > 0)
                    FROM indicateur_resultat_import iri
                    WHERE ((iri.collectivite_id = rempli.collectivite_id) AND ((iri.indicateur_id)::text = (rempli.indicateur_id)::text))
                    UNION
                    SELECT (count(iri.valeur) > 0)
                    FROM (indicateur_resultat_import iri
                        JOIN indicateur_definition def ON (((iri.indicateur_id)::text = (def.valeur_indicateur)::text)))
                    WHERE ((iri.collectivite_id = rempli.collectivite_id) AND ((def.id)::text = (rempli.indicateur_id)::text))
                    )
SELECT bool_or(remplissage.rempli) AS bool_or
FROM remplissage;
END;
comment on function private.rempli(integer, indicateur_id) is 'Vrai si l''indicateur est rempli.';

-- private.rempli(integer);
create function private.rempli(indicateur_perso_id integer) returns boolean
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT (count(ipr.valeur) > 0)
FROM indicateur_personnalise_resultat ipr
WHERE (ipr.indicateur_id = rempli.indicateur_perso_id);
END;
comment on function private.rempli(integer) is 'Vrai si l''indicateur est rempli.';

-- private.is_valeur_confidentielle(integer, integer);
create function private.is_valeur_confidentielle(indicateur_perso_id integer, annee integer) returns boolean
    stable
    security definer
    language sql
BEGIN ATOMIC
RETURN ((EXISTS ( SELECT c.indicateur_id,
                         c.indicateur_perso_id,
                         c.collectivite_id
                  FROM indicateur_confidentiel c
                  WHERE (c.indicateur_perso_id = is_valeur_confidentielle.indicateur_perso_id))) AND (annee = ( SELECT max(r.annee) AS max
                                                                                                                FROM indicateur_personnalise_resultat r
                                                                                                                WHERE ((r.indicateur_id = is_valeur_confidentielle.indicateur_perso_id) AND (r.valeur IS NOT NULL)))));
END;
comment on function private.is_valeur_confidentielle(integer, integer) is 'Vrai si la valeur annuelle de l''indicateur est confidentielle.';


-- private.is_valeur_confidentielle(integer, indicateur_id, integer);
create function private.is_valeur_confidentielle(collectivite_id integer, indicateur_id indicateur_id, annee integer) returns boolean
    stable
    security definer
    language sql
BEGIN ATOMIC
RETURN ((EXISTS ( SELECT c.indicateur_id,
                         c.indicateur_perso_id,
                         c.collectivite_id
                  FROM indicateur_confidentiel c
                  WHERE ((c.indicateur_id = (is_valeur_confidentielle.indicateur_id)::text) AND (c.collectivite_id = is_valeur_confidentielle.collectivite_id)))) AND (annee = ( SELECT max(r.annee) AS max
                                                                                                                                                                                 FROM indicateur_resultat r
                                                                                                                                                                                 WHERE (((r.indicateur_id)::text = (is_valeur_confidentielle.indicateur_id)::text) AND (r.collectivite_id = is_valeur_confidentielle.collectivite_id) AND (r.valeur IS NOT NULL)))));
END;
comment on function private.is_valeur_confidentielle(integer, indicateur_id, integer) is 'Vrai si la valeur annuelle de l''indicateur est confidentielle.';

-- private.indicateur_personnalise_collectivite_id;
create function private.indicateur_personnalise_collectivite_id(indicateur_id integer) returns integer
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT indicateur_personnalise_definition.collectivite_id
FROM indicateur_personnalise_definition
WHERE (indicateur_personnalise_definition.id = indicateur_personnalise_collectivite_id.indicateur_id);
END;
comment on function private.indicateur_personnalise_collectivite_id(integer) is 'Renvoie la collectivité d''un indicateur à partir de son id';

-- private.enlever_indicateur;
create function private.enlever_indicateur(fiche_id integer, indicateur indicateur_generique) returns void
    language plpgsql
as
$$
begin
    if indicateur.indicateur_id is null then
        delete from fiche_action_indicateur
        where fiche_action_indicateur.fiche_id = enlever_indicateur.fiche_id
          and indicateur_personnalise_id = indicateur.indicateur_personnalise_id;
    else
        delete from fiche_action_indicateur
        where fiche_action_indicateur.fiche_id = enlever_indicateur.fiche_id
          and indicateur_id = indicateur.indicateur_id;
    end if;
end;
$$;
comment on function private.enlever_indicateur(integer, indicateur_generique) is 'Enlever une indicateur à la fiche';

-- private.ajouter_indicateur;
create function private.ajouter_indicateur(fiche_id integer, indicateur indicateur_generique) returns void
    language plpgsql
as
$$
begin
    insert into fiche_action_indicateur (fiche_id, indicateur_id, indicateur_personnalise_id)
    values (ajouter_indicateur.fiche_id, indicateur.indicateur_id, indicateur.indicateur_personnalise_id);
end;
$$;
comment on function private.ajouter_indicateur(integer, indicateur_generique) is 'Ajouter une indicateur à la fiche';


-- public.upsert_fiche_action;
create function public.upsert_fiche_action() returns trigger
    security definer
    language plpgsql
as
$$
declare
    id_fiche        integer;
    thematique      thematique;
    sous_thematique sous_thematique;
    axe             axe;
    partenaire      partenaire_tag;
    structure       structure_tag;
    pilote          personne;
    referent        personne;
    action          action_relation;
    indicateur      indicateur_generique;
    service         service_tag;
    financeur       financeur_montant;
    fiche_liee      fiche_resume;
begin
    id_fiche = new.id;
    if not have_edition_acces(new.collectivite_id) and not is_service_role() then
        perform set_config('response.status', '401', true);
        raise 'Modification non autorisé.';
    end if;
    -- Fiche action
    if id_fiche is null then
        insert into fiche_action (titre,
                                  description,
                                  piliers_eci,
                                  objectifs,
                                  resultats_attendus,
                                  cibles,
                                  ressources,
                                  financements,
                                  budget_previsionnel,
                                  statut,
                                  niveau_priorite,
                                  date_debut,
                                  date_fin_provisoire,
                                  amelioration_continue,
                                  calendrier,
                                  notes_complementaires,
                                  maj_termine,
                                  collectivite_id,
                                  restreint)
        values (new.titre,
                new.description,
                new.piliers_eci,
                new.objectifs,
                new.resultats_attendus,
                new.cibles,
                new.ressources,
                new.financements,
                new.budget_previsionnel,
                new.statut,
                new.niveau_priorite,
                new.date_debut,
                new.date_fin_provisoire,
                new.amelioration_continue,
                new.calendrier,
                new.notes_complementaires,
                new.maj_termine,
                new.collectivite_id,
                new.restreint)
        returning id into id_fiche;
        new.id = id_fiche;
    else
        update fiche_action
        set titre                = new.titre,
            description= new.description,
            piliers_eci= new.piliers_eci,
            objectifs= new.objectifs,
            resultats_attendus= new.resultats_attendus,
            cibles= new.cibles,
            ressources= new.ressources,
            financements= new.financements,
            budget_previsionnel= new.budget_previsionnel,
            statut= new.statut,
            niveau_priorite= new.niveau_priorite,
            date_debut= new.date_debut,
            date_fin_provisoire= new.date_fin_provisoire,
            amelioration_continue= new.amelioration_continue,
            calendrier= new.calendrier,
            notes_complementaires= new.notes_complementaires,
            maj_termine= new.maj_termine,
            collectivite_id      = new.collectivite_id,
            restreint            = new.restreint
        where id = id_fiche;
    end if;

    -- Thématiques
    delete from fiche_action_thematique where fiche_id = id_fiche;
    if new.thematiques is not null then
        foreach thematique in array new.thematiques::thematique[]
            loop
                perform private.ajouter_thematique(id_fiche, thematique.nom);
            end loop;
    end if;
    delete from fiche_action_sous_thematique where fiche_id = id_fiche;
    if new.sous_thematiques is not null then
        foreach sous_thematique in array new.sous_thematiques::sous_thematique[]
            loop
                perform private.ajouter_sous_thematique(id_fiche, sous_thematique.id);
            end loop;
    end if;

    -- Axes
    delete from fiche_action_axe where fiche_id = id_fiche;
    if new.axes is not null then
        foreach axe in array new.axes::axe[]
            loop
                perform ajouter_fiche_action_dans_un_axe(id_fiche, axe.id);
            end loop;
    end if;

    -- Partenaires
    delete from fiche_action_partenaire_tag where fiche_id = id_fiche;
    if new.partenaires is not null then
        foreach partenaire in array new.partenaires::partenaire_tag[]
            loop
                perform private.ajouter_partenaire(id_fiche, partenaire);
            end loop;
    end if;

    -- Structures
    delete from fiche_action_structure_tag where fiche_id = id_fiche;
    if new.structures is not null then
        foreach structure in array new.structures
            loop
                perform private.ajouter_structure(id_fiche, structure);
            end loop;
    end if;

    -- Pilotes
    delete from fiche_action_pilote where fiche_id = id_fiche;
    if new.pilotes is not null then
        foreach pilote in array new.pilotes::personne[]
            loop
                perform private.ajouter_pilote(id_fiche, pilote);
            end loop;
    end if;
    -- Referents
    delete from fiche_action_referent where fiche_id = id_fiche;
    if new.referents is not null then
        foreach referent in array new.referents::personne[]
            loop
                perform private.ajouter_referent(id_fiche, referent);
            end loop;
    end if;

    -- Actions
    delete from fiche_action_action where fiche_id = id_fiche;
    if new.actions is not null then
        foreach action in array new.actions::action_relation[]
            loop
                perform private.ajouter_action(id_fiche, action.id);
            end loop;
    end if;

    -- Indicateurs
    delete from fiche_action_indicateur where fiche_id = id_fiche;
    if new.indicateurs is not null then
        foreach indicateur in array new.indicateurs::indicateur_generique[]
            loop
                perform private.ajouter_indicateur(id_fiche, indicateur);
            end loop;
    end if;

    -- Services
    delete from fiche_action_service_tag where fiche_id = id_fiche;
    if new.services is not null then
        foreach service in array new.services
            loop
                perform private.ajouter_service(id_fiche, service);
            end loop;
    end if;
    -- Financeurs
    delete from fiche_action_financeur_tag where fiche_id = id_fiche;
    if new.financeurs is not null then
        foreach financeur in array new.financeurs::financeur_montant[]
            loop
                perform private.ajouter_financeur(id_fiche, financeur);
            end loop;
    end if;

    -- Fiches liees
    delete from fiche_action_lien where fiche_une = id_fiche or fiche_deux = id_fiche;
    if new.fiches_liees is not null then
        foreach fiche_liee in array new.fiches_liees::private.fiche_resume[]
            loop
                insert into fiche_action_lien (fiche_une, fiche_deux)
                values (id_fiche, fiche_liee.id);
            end loop;
    end if;

    return new;
end;
$$;

-- trigger upsert on public.fiches_action;
create trigger upsert
    instead of insert or update
    on public.fiches_action
    for each row
execute procedure upsert_fiche_action();

-- public.thematiques
create function public.thematiques(indicateur_definitions) returns SETOF thematique
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT t.thematique
FROM ( SELECT thematique.*::thematique AS thematique
       FROM (indicateur_definition definition
           JOIN thematique ON ((thematique.md_id = ANY (definition.thematiques))))
       WHERE ((definition.id)::text = (($1).indicateur_id)::text)
       UNION
       SELECT thematique.*::thematique AS thematique
       FROM ((indicateur_personnalise_definition definition
           JOIN indicateur_personnalise_thematique it ON ((definition.id = it.indicateur_id)))
           JOIN thematique ON ((it.thematique_id = thematique.id)))
       WHERE (definition.id = ($1).indicateur_perso_id)) t
WHERE can_read_acces_restreint(($1).collectivite_id);
END;
comment on function thematiques(indicateur_definitions) is 'Les thématiques associées à un indicateur.';

-- public.services;
create function public.services(indicateur_definitions) returns SETOF indicateur_service_tag
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT ist.*::indicateur_service_tag AS ist
FROM (indicateur_service_tag ist
    LEFT JOIN definition_referentiel($1) def(modified_at, id, identifiant, valeur_indicateur, nom, description, unite, participation_score, selection, titre_long, parent, source, type, thematiques, programmes, sans_valeur) ON (true))
WHERE ((((($1).indicateur_id IS NOT NULL) AND ((ist.indicateur_id)::text = (($1).indicateur_id)::text) AND (ist.collectivite_id = ($1).collectivite_id)) OR ((($1).indicateur_id IS NOT NULL) AND ((ist.indicateur_id)::text = (def.valeur_indicateur)::text) AND (ist.collectivite_id = ($1).collectivite_id)) OR ((($1).indicateur_perso_id IS NOT NULL) AND (ist.indicateur_perso_id = ($1).indicateur_perso_id))) AND can_read_acces_restreint(ist.collectivite_id));
END;
comment on function public.services(indicateur_definitions) is 'Les services associés à un indicateur.';

-- public.rewrite_indicateur_id;
create function public.rewrite_indicateur_id() returns trigger
    language plpgsql
as
$$
declare
    valeur_id indicateur_id;
begin
    select valeur_indicateur
    into valeur_id
    from indicateur_definition
    where id = new.indicateur_id;

    if valeur_id is not null
    then
        new.indicateur_id = valeur_id;
    end if;

    return new;
end;
$$;
comment on function public.rewrite_indicateur_id() is 'Réécrit les ids des indicateurs pour les résultats et les objectifs.';

-- trigger rewrite_indicateur_id on public.fiche_action_indicateur;
create trigger rewrite_indicateur_id
    before insert or update
    on fiche_action_indicateur
    for each row
execute procedure rewrite_indicateur_id();

-- trigger rewrite_indicateur_id on public.indicateur_confidentiel;
create trigger rewrite_indicateur_id
    before insert or update
    on indicateur_confidentiel
    for each row
execute procedure rewrite_indicateur_id();
comment on trigger rewrite_indicateur_id on indicateur_confidentiel is 'Remplace les `indicateur_id` des indicateurs `sans valeur` de la même manière que pour les valeurs';

-- trigger rewrite_indicateur_id on public.indicateur_objectif;
create trigger rewrite_indicateur_id
    before insert or update
    on indicateur_objectif
    for each row
execute procedure rewrite_indicateur_id();

-- trigger rewrite_indicateur_id on public.indicateur_pilote;
create trigger rewrite_indicateur_id
    before insert or update
    on indicateur_pilote
    for each row
execute procedure rewrite_indicateur_id();
comment on trigger rewrite_indicateur_id on indicateur_pilote is 'Remplace les `indicateur_id` des indicateurs `sans valeur` de la même manière que pour les valeurs';

-- trigger rewrite_indicateur_id on public.indicateur_resultat;
create trigger rewrite_indicateur_id
    before insert or update
    on indicateur_resultat
    for each row
execute procedure rewrite_indicateur_id();

-- trigger rewrite_indicateur_id on public.indicateur_service_tag;
create trigger rewrite_indicateur_id
    before insert or update
    on indicateur_service_tag
    for each row
execute procedure rewrite_indicateur_id();
comment on trigger rewrite_indicateur_id on indicateur_service_tag is 'Remplace les `indicateur_id` des indicateurs `sans valeur` de la même manière que pour les valeurs';

-- public.rempli(indicateur_definitions)
create function rempli(indicateur_definitions) returns boolean
    stable
    security definer
    language sql
BEGIN ATOMIC
RETURN
    CASE
        WHEN (($1).indicateur_perso_id IS NULL) THEN
            private.rempli(($1).collectivite_id, ($1).indicateur_id)
        ELSE private.rempli(($1).indicateur_perso_id)
    END;
END;
comment on function rempli(indicateur_definitions) is 'Vrai si l''indicateur est rempli.';

-- public.indicateur_summary;
create view public.indicateur_summary as
SELECT c.id                      AS collectivite_id,
       programme.programme::text AS categorie,
       digest.nombre,
       digest.rempli
FROM collectivite c
CROSS JOIN unnest(enum_range(NULL::indicateur_programme)) programme(programme)
JOIN LATERAL ( SELECT count(*)                                             AS nombre,
                      count(*) FILTER (WHERE private.rempli(c.id, def.id)) AS rempli
               FROM indicateur_definition def
               WHERE def.parent IS NULL
                 AND (programme.programme = ANY (def.programmes))) digest ON true
WHERE can_read_acces_restreint(c.id)
UNION ALL
SELECT perso.collectivite_id,
       'perso'::text                                    AS categorie,
       count(*)                                         AS nombre,
       count(*) FILTER (WHERE private.rempli(perso.id)) AS rempli
FROM indicateur_personnalise_definition perso
WHERE have_lecture_acces(perso.collectivite_id)
GROUP BY perso.collectivite_id;
comment on view indicateur_summary is 'Permet d''obtenir le nombre de résultats saisis par indicateur pour chaque collectivité.';

-- public.plan_action_export;
create function public.plan_action_export(id integer) returns SETOF fiche_action_export
    language sql
BEGIN ATOMIC
WITH RECURSIVE parents AS (
                          SELECT axe.id,
                                 axe.nom,
                                 axe.collectivite_id,
                                 0 AS depth,
                                 ARRAY[]::text[] AS path,
                                 ('0 '::text || axe.nom) AS sort_path
                          FROM axe
                          WHERE ((axe.parent IS NULL) AND (axe.id = plan_action_export.id) AND can_read_acces_restreint(axe.collectivite_id))
                          UNION ALL
                          SELECT a.id,
                                 a.nom,
                                 a.collectivite_id,
                                 (p_1.depth + 1),
                                 (p_1.path || p_1.nom),
                                 ((((p_1.sort_path || ' '::text) || (p_1.depth + 1)) || ' '::text) || a.nom)
                          FROM (parents p_1
                              JOIN axe a ON ((a.parent = p_1.id)))
                          ), fiches AS (
                          SELECT a.id AS axe_id,
                                 f_1.*::fiches_action AS fiche,
                                 f_1.titre
                          FROM ((parents a
                              JOIN fiche_action_axe faa ON ((a.id = faa.axe_id)))
                              JOIN fiches_action f_1 ON (((f_1.collectivite_id = a.collectivite_id) AND (faa.fiche_id = f_1.id))))
                          )
SELECT p.id,
       p.nom,
       p.path,
       to_jsonb(f.*) AS to_jsonb
FROM (parents p
    LEFT JOIN fiches f ON ((p.id = f.axe_id)))
ORDER BY (naturalsort((p.sort_path || (COALESCE(f.titre, ''::character varying))::text)));
END;

-- public.pilotes;
create function public.pilotes(indicateur_definitions) returns SETOF indicateur_pilote
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT ip.*::indicateur_pilote AS ip
FROM (indicateur_pilote ip
    LEFT JOIN definition_referentiel($1) def(modified_at, id, identifiant, valeur_indicateur, nom, description, unite, participation_score, selection, titre_long, parent, source, type, thematiques, programmes, sans_valeur) ON (true))
WHERE ((((($1).indicateur_id IS NOT NULL) AND ((ip.indicateur_id)::text = (($1).indicateur_id)::text) AND (ip.collectivite_id = ($1).collectivite_id)) OR ((($1).indicateur_id IS NOT NULL) AND ((ip.indicateur_id)::text = (def.valeur_indicateur)::text) AND (ip.collectivite_id = ($1).collectivite_id)) OR ((($1).indicateur_perso_id IS NOT NULL) AND (ip.indicateur_perso_id = ($1).indicateur_perso_id))) AND can_read_acces_restreint(ip.collectivite_id));
END;
comment on function public.pilotes(indicateur_definitions) is 'Les personnes pilotes associées à un indicateur.';

-- public.personne;
create function public.personne(indicateur_pilote) returns SETOF personne
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT private.get_personne($1) AS get_personne
WHERE can_read_acces_restreint(($1).collectivite_id);
END;
comment on function public.personne(indicateur_pilote) is 'Une personne associée comme personne pilote d''un indicateur.';

-- public.indicateurs_gaz_effet_serre;
create function public.indicateurs_gaz_effet_serre(site_labellisation) returns SETOF indicateur_resultat_import[]
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT COALESCE(( SELECT array_agg(iri.*) AS array_agg
                  FROM indicateur_resultat_import iri
                  WHERE ((iri.collectivite_id = ($1).collectivite_id) AND ((iri.indicateur_id)::text = ANY ((ARRAY['cae_1.g'::character varying, 'cae_1.f'::character varying, 'cae_1.h'::character varying, 'cae_1.j'::character varying, 'cae_1.i'::character varying, 'cae_1.c'::character varying, 'cae_1.e'::character varying, 'cae_1.d'::character varying, 'cae_1.a'::character varying])::text[])))), '{}'::indicateur_resultat_import[]) AS "coalesce";
END;
comment on function public.indicateurs_gaz_effet_serre(site_labellisation) is 'Indicateurs gaz à effet de serre.';

-- public.indicateur_action; -- Utilise public.indicateur_definitions
create function public.indicateur_action(indicateur_definitions) returns SETOF indicateur_action
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT ia.*::indicateur_action AS ia
FROM indicateur_action ia
WHERE (((ia.indicateur_id)::text = (($1).indicateur_id)::text) AND is_authenticated());
END;
comment on function public.indicateur_action(indicateur_definitions) is 'La relation entre un indicateur prédéfini et des actions des référentiels.';

-- public.import_sources;
create function public.import_sources(indicateur_definitions) returns SETOF indicateur_source
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT DISTINCT s.*::indicateur_source AS s
FROM (indicateur_resultat_import iri
    JOIN indicateur_source s ON ((s.id = iri.source_id)))
WHERE (((iri.indicateur_id)::text = (($1).indicateur_id)::text) AND (iri.collectivite_id = ($1).collectivite_id));
END;
comment on function public.import_sources(indicateur_definitions) is 'Les sources de données importées associées à un indicateur prédéfini.';

-- public.fiches_non_classees;
create function public.fiches_non_classees(indicateur_definitions) returns SETOF fiche_action_indicateur
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT fai.*::fiche_action_indicateur AS fai
FROM ((fiche_action_indicateur fai
    JOIN fiche_action fa ON (((fa.id = fai.fiche_id) AND (fa.collectivite_id = ($1).collectivite_id))))
    LEFT JOIN definition_referentiel($1) def(modified_at, id, identifiant, valeur_indicateur, nom, description, unite, participation_score, selection, titre_long, parent, source, type, thematiques, programmes, sans_valeur) ON (true))
WHERE ((NOT (EXISTS ( SELECT
                      FROM fiche_action_axe faa
                      WHERE (faa.fiche_id = fai.fiche_id)))) AND (((fai.indicateur_id)::text = (($1).indicateur_id)::text) OR (fai.indicateur_personnalise_id = ($1).indicateur_perso_id) OR ((def.valeur_indicateur)::text = (($1).indicateur_id)::text)) AND can_read_acces_restreint(fa.collectivite_id));
END;
comment on function public.fiches_non_classees(indicateur_definitions) is 'Les fiches non classées (sans plan d''action) associées à un indicateur.';

-- public.fiche_resume(fiche_action_indicateur);
create function public.fiche_resume(fiche_action_indicateur fiche_action_indicateur) returns SETOF fiche_resume
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint,
       fr.amelioration_continue
FROM private.fiche_resume fr
WHERE ((fr.id = (fiche_resume.fiche_action_indicateur).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END;


-- public.enfants(indicateur_definitions);
create function public.enfants(indicateur_definitions) returns SETOF indicateur_definitions
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT ($1).collectivite_id AS collectivite_id,
       definition.id AS indicateur_id,
       NULL::integer AS indicateur_perso_id,
       definition.nom,
       definition.description,
       definition.unite
FROM indicateur_definition definition
WHERE (((definition.parent)::text = (($1).indicateur_id)::text) AND is_authenticated());
END;
comment on function public.enfants(indicateur_definitions) is 'Définitions des indicateurs enfants d''un indicateur composé.';

-- public.enfants(indicateur_definition);
create function public.enfants(indicateur_definition) returns SETOF indicateur_definition
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT def.*::indicateur_definition AS def
FROM indicateur_definition def
WHERE (((def.parent)::text = (($1).id)::text) AND is_authenticated());
END;
comment on function public.enfants(indicateur_definition) is 'Définitions des indicateurs enfants d''un indicateur composé.';


-- public.delete_indicateur_personnalise_definition;
create function public.delete_indicateur_personnalise_definition(indicateur_id uuid) returns void
    language plpgsql
as
$$
BEGIN

    UPDATE "public"."indicateur_personnalise_definition"
    SET "deleted_at" = NOW()
    WHERE "id" = indicateur_id;

END
$$;
comment on function public.delete_indicateur_personnalise_definition(uuid) is 'Supprime un indicateur personnalisé.';

-- public.delete_fiche_action;
create function public.delete_fiche_action() returns trigger
    security definer
    language plpgsql
as
$$
declare
begin
    delete from fiche_action_thematique where fiche_id = old.id;
    delete from fiche_action_sous_thematique where fiche_id = old.id;
    delete from fiche_action_partenaire_tag where fiche_id = old.id;
    delete from fiche_action_structure_tag where fiche_id = old.id;
    alter table fiche_action_pilote disable trigger save_history;
    delete from fiche_action_pilote where fiche_id = old.id;
    alter table fiche_action_pilote enable trigger save_history;
    delete from fiche_action_referent where fiche_id = old.id;
    delete from fiche_action_indicateur where fiche_id = old.id;
    delete from fiche_action_action where fiche_id = old.id;
    delete from fiche_action_axe where fiche_id = old.id;
    delete from fiche_action_financeur_tag where fiche_id = old.id;
    delete from fiche_action_service_tag where fiche_id = old.id;
    delete from fiche_action_lien where fiche_une = old.id or fiche_deux = old.id;
    return old;
end;
$$;

-- trigger delete on fiche_action
create trigger delete
    before delete
    on fiche_action
    for each row
execute procedure delete_fiche_action();

-- public.definition_perso;
create function public.definition_perso(indicateur_definitions) returns SETOF indicateur_personnalise_definition
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT ipd.*::indicateur_personnalise_definition AS ipd
FROM indicateur_personnalise_definition ipd
WHERE ((ipd.id = ($1).indicateur_perso_id) AND can_read_acces_restreint(ipd.collectivite_id));
END;
comment on function public.definition_perso(indicateur_definitions) is 'La définition de l''indicateur personnalisé.';

-- public.create_fiche;
create function public.create_fiche(collectivite_id integer, axe_id integer DEFAULT NULL::integer, action_id action_id DEFAULT NULL::character varying, indicateur_referentiel_id indicateur_id DEFAULT NULL::character varying, indicateur_personnalise_id integer DEFAULT NULL::integer) returns fiche_resume
    security definer
    language plpgsql
as
$$
declare
    new_fiche_id int;
    resume       fiche_resume;
begin
    if not have_edition_acces(create_fiche.collectivite_id) and not is_service_role()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    insert into fiche_action (collectivite_id, titre)
    values (create_fiche.collectivite_id, '')
    returning id into new_fiche_id;

    if create_fiche.axe_id is not null
    then
        insert into fiche_action_axe (fiche_id, axe_id)
        values (new_fiche_id, create_fiche.axe_id);
    end if;

    if create_fiche.action_id is not null
    then
        insert into fiche_action_action (fiche_id, action_id)
        values (new_fiche_id, create_fiche.action_id);
    end if;

    if create_fiche.indicateur_referentiel_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_id)
        values (new_fiche_id, create_fiche.indicateur_referentiel_id);
    end if;

    if create_fiche.indicateur_personnalise_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_personnalise_id)
        values (new_fiche_id, create_fiche.indicateur_personnalise_id);
    end if;

    select * from fiche_resume where id = new_fiche_id limit 1 into resume;
    return resume;
end;
$$;
comment on function public.create_fiche(integer, integer, action_id, indicateur_id, integer) is 'Crée une nouvelle fiche action dans un axe, une action ou un indicateur.';

-- public.confidentiel
create function public.confidentiel(indicateur_definitions) returns boolean
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT count(*) > 0
FROM indicateur_confidentiel ic
LEFT JOIN definition_referentiel($1) def ON true
WHERE (
          (
              ($1).indicateur_id IS NOT NULL
                  AND ic.indicateur_id = ($1).indicateur_id::text
                  AND ic.collectivite_id = ($1).collectivite_id
              ) OR (
              ($1).indicateur_id IS NOT NULL
                  AND ic.indicateur_id = def.valeur_indicateur::text
                  AND ic.collectivite_id = ($1).collectivite_id
              ) OR (
              ($1).indicateur_perso_id IS NOT NULL
                  AND ic.indicateur_perso_id = ($1).indicateur_perso_id
              )
          );
END;

comment on function confidentiel(indicateur_definitions) is 'Vrai si l''indicateur est confidentiel.';

-- public.cherchable(indicateur_personnalise_definition);
create function public.cherchable(indicateur_personnalise_definition) returns text
    immutable
    language sql
BEGIN ATOMIC
RETURN unaccent(((($1).titre || ' '::text) || ($1).description));
END;
comment on function public.cherchable(indicateur_personnalise_definition) is 'Le champ sur lequel effectuer la recherche.';


-- public.cherchable(indicateur_definitions);
create function public.cherchable(indicateur_definitions) returns text
    immutable
    language sql
BEGIN ATOMIC
RETURN unaccent(((($1).nom || ' '::text) || ($1).description));
END;
comment on function public.cherchable(indicateur_definitions) is 'Le champ sur lequel effectuer la recherche.';

-- public.cherchable(indicateur_definition);
create function public.cherchable(indicateur_definition) returns text
    immutable
    language sql
BEGIN ATOMIC
RETURN unaccent(((($1).nom || ' '::text) || ($1).description));
END;
comment on function public.cherchable(indicateur_definition) is 'Le champ sur lequel effectuer la recherche.';

-- index indicateur_personnalise_definition_fts
create index indicateur_personnalise_definition_fts
    on indicateur_personnalise_definition
        using gin (collectivite_id, to_tsvector('fr', cherchable(indicateur_personnalise_definition)));

-- index indicateur_definition_fts
create index indicateur_definition_fts
    on indicateur_definition
        using gin (to_tsvector('fr', cherchable(indicateur_definition)));

-- public.axes(indicateur_definitions)
create function public.axes(indicateur_definitions) returns SETOF axe
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT axe.*::axe AS axe
FROM fiche_action_indicateur fai
JOIN fiche_action_axe faa USING (fiche_id)
JOIN axe ON faa.axe_id = axe.id
LEFT JOIN definition_referentiel($1) def ON true
WHERE (
    (
        ($1).indicateur_id IS NOT NULL
            AND fai.indicateur_id::text = ($1).indicateur_id::text
            AND axe.collectivite_id = ($1).collectivite_id
        ) OR (
        ($1).indicateur_id IS NOT NULL
            AND fai.indicateur_id::text = def.valeur_indicateur::text
            AND axe.collectivite_id = ($1).collectivite_id
        ) OR (
        ($1).indicateur_perso_id IS NOT NULL
            AND fai.indicateur_personnalise_id = ($1).indicateur_perso_id
        )
    ) AND can_read_acces_restreint(axe.collectivite_id);
END;
comment on function axes(indicateur_definitions) is 'Les axes (plans d''action) associés à un indicateur.';


-- Ré-ajoute les droits des anciennes tables
alter table public.fiche_action_indicateur enable row level security;
create policy allow_read on fiche_action_indicateur for select using (peut_lire_la_fiche(fiche_id));
create policy allow_update on fiche_action_indicateur for update using (peut_modifier_la_fiche(fiche_id));
create policy allow_insert on fiche_action_indicateur for insert with check (peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_indicateur for delete using (peut_modifier_la_fiche(fiche_id));

alter table public.indicateur_action enable row level security;
create policy allow_read on indicateur_action for select using (is_authenticated());

alter table public.indicateur_pilote enable row level security;
create policy allow_read on indicateur_pilote for select using (private.can_read(indicateur_pilote.*));
create policy allow_insert on indicateur_pilote for insert with check (private.can_write(indicateur_pilote.*));
create policy allow_update on indicateur_pilote for update using (private.can_write(indicateur_pilote.*));
create policy allow_delete on indicateur_pilote for delete using (private.can_write(indicateur_pilote.*));

alter table public.indicateur_service_tag enable row level security;
create policy allow_read on indicateur_service_tag for select using (private.can_read(indicateur_service_tag.*));
create policy allow_insert on indicateur_service_tag for insert with check (private.can_write(indicateur_service_tag.*));
create policy allow_update on indicateur_service_tag for update using (private.can_write(indicateur_service_tag.*));
create policy allow_delete on indicateur_service_tag for delete using (private.can_write(indicateur_service_tag.*));

alter table public.indicateur_personnalise_thematique enable row level security;
create policy allow_read on indicateur_personnalise_thematique for select using (
    can_read_acces_restreint(private.indicateur_personnalise_collectivite_id(indicateur_id)));
create policy allow_insert on indicateur_personnalise_thematique for insert with check (
    have_edition_acces(private.indicateur_personnalise_collectivite_id(indicateur_id)));
create policy allow_update on indicateur_personnalise_thematique for update using (
    have_edition_acces(private.indicateur_personnalise_collectivite_id(indicateur_id)));
create policy allow_delete on indicateur_personnalise_thematique for delete using (
    have_edition_acces(private.indicateur_personnalise_collectivite_id(indicateur_id)));

alter table public.indicateur_confidentiel enable row level security;
create policy allow_read on indicateur_confidentiel for select using (private.can_read(indicateur_confidentiel.*));
create policy allow_insert on indicateur_confidentiel for insert with check (private.can_write(indicateur_confidentiel.*));
create policy allow_update on indicateur_confidentiel for update using (private.can_write(indicateur_confidentiel.*));
create policy allow_delete on indicateur_confidentiel for delete using (private.can_write(indicateur_confidentiel.*));

alter table public.indicateur_resultat enable row level security;
create policy allow_read on indicateur_resultat for select using ((
                                                                  select (can_read_acces_restreint(indicateur_resultat.collectivite_id) and
                                                                          (have_lecture_acces(indicateur_resultat.collectivite_id) or
                                                                           (not private.is_valeur_confidentielle(indicateur_resultat.collectivite_id,
                                                                                                                 indicateur_resultat.indicateur_id,
                                                                                                                 indicateur_resultat.annee))))));
create policy allow_insert on indicateur_resultat for insert with check (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_update on indicateur_resultat for update using (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));

alter table public.indicateur_resultat_commentaire enable row level security;
create policy allow_read on indicateur_resultat_commentaire for select using (
    can_read_acces_restreint(collectivite_id));
create policy allow_insert on indicateur_resultat_commentaire for insert with check (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_update on indicateur_resultat_commentaire for update using (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));

alter table public.indicateur_resultat_import enable row level security;
create policy allow_read on indicateur_resultat_import for select using (
    can_read_acces_restreint(collectivite_id));

alter table public.indicateur_objectif enable row level security;
create policy allow_read on indicateur_objectif for select using (can_read_acces_restreint(collectivite_id));
create policy allow_insert on indicateur_objectif for insert with check (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_update on indicateur_objectif for update using (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));


alter table public.indicateur_objectif_commentaire enable row level security;
create policy allow_read on indicateur_objectif_commentaire for select using (
    can_read_acces_restreint(collectivite_id));
create policy allow_insert on indicateur_objectif_commentaire for insert with check (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_update on indicateur_objectif_commentaire for update using (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));

alter table public.indicateur_definition enable row level security;
create policy allow_read on indicateur_definition for select using (is_authenticated());

alter table public.indicateur_parent enable row level security;


alter table public.indicateur_personnalise_resultat enable row level security;
create policy allow_read on indicateur_personnalise_resultat for select using (
    (select (can_read_acces_restreint(indicateur_personnalise_resultat.collectivite_id) and
             (have_lecture_acces(indicateur_personnalise_resultat.collectivite_id) or
              (not private.is_valeur_confidentielle(indicateur_personnalise_resultat.indicateur_id,
                                                    indicateur_personnalise_resultat.annee))))));
create policy allow_insert on indicateur_personnalise_resultat for insert with check (
    have_edition_acces(collectivite_id));
create policy allow_update on indicateur_personnalise_resultat for update using (
    have_edition_acces(collectivite_id));

alter table public.indicateur_perso_resultat_commentaire enable row level security;
create policy allow_read on indicateur_perso_resultat_commentaire for select using (
    can_read_acces_restreint(collectivite_id));
create policy allow_insert on indicateur_perso_resultat_commentaire for insert with check (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_update on indicateur_perso_resultat_commentaire for update using (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));

alter table public.indicateur_personnalise_objectif enable row level security;
create policy allow_read on indicateur_personnalise_objectif for select using (
    can_read_acces_restreint(collectivite_id));
create policy allow_insert on indicateur_personnalise_objectif for insert with check (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_update on indicateur_personnalise_objectif for update using (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));

alter table public.indicateur_perso_objectif_commentaire enable row level security;
create policy allow_read on indicateur_perso_objectif_commentaire for select using (
    can_read_acces_restreint(collectivite_id));
create policy allow_insert on indicateur_perso_objectif_commentaire for insert with check (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_update on indicateur_perso_objectif_commentaire for update using (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));

alter table public.indicateur_personnalise_definition enable row level security;
create policy allow_read on indicateur_personnalise_definition for select using (
    can_read_acces_restreint(collectivite_id));
create policy allow_insert on indicateur_personnalise_definition for insert with check (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));
create policy allow_update on indicateur_personnalise_definition for update using (
    have_edition_acces(collectivite_id) OR private.est_auditeur(collectivite_id));

alter table public.indicateurs_json enable row level security;
alter table public.indicateur_terristory_json enable row level security;
alter table public.action_impact_indicateur enable row level security;

COMMIT;

insert into public.indicateur_definition (collectivite_id, titre, unite, modified_by, description)
values (1, 'Mon indicateur perso', 'm2/hab', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 'Description');

insert into public.indicateur_collectivite (indicateur_id, collectivite_id, commentaire)
values ((select id from indicateur_definition where identifiant_referentiel = 'cae_8' limit 1),
        1, 'un commentaire sur cae_8'),
       ((select id from indicateur_definition where titre = 'Mon indicateur perso' limit 1),
    1, 'Mon commentaire');

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat,
                                      resultat_commentaire, objectif, objectif_commentaire)
values
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_8' limit 1),
        1 , '01/01/2020', null, 20, null, 21, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_8' limit 1),
     1 , '01/01/2021', null, 12, null, 13, null),
    ((select id from indicateur_definition where titre = 'Mon indicateur perso' limit 1),
     1 , '01/01/2021', null, 22.33, null, 23.33, null);


-- Ajout d'indicateurs open-data

INSERT INTO "public"."indicateur_source_metadonnee"
    ("id", "source_id", "date_version", "nom_donnees", "diffuseur", "producteur", "methodologie", "limites")
    VALUES
    (1, 'citepa', '2023-01-01 00:00:00', '', 'Citepa', 'Citepa - Territoires en Transitions', 'Inventaire GES spatialisé (CITEPA 2023 - année 2021 et CITEPA 2021 - années 2016 et 2018) et périmètre (Banatic 2023)', '');

INSERT INTO public.indicateur_valeur
    (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
VALUES
    (48, 1, '2025-01-01', 1, 1.8, null, null, null),
    (48, 1, '2024-01-01', 1, 1.5, null, null, null),
    (17, 1, '2024-01-01', 1, null, null, 16, null);

-- Insertion de la source rare
INSERT INTO public.indicateur_source (id, libelle) VALUES ('rare', 'RARE-OREC');
INSERT INTO public.indicateur_source_metadonnee (id, source_id, date_version, nom_donnees, diffuseur, producteur, methodologie, limites)
VALUES (2, 'rare', '2024-07-18T00:00:00.000Z', '', 'OREC', '', 'Scope 1&2 (approche cadastrale)', '');

-- Insertion de la source snbc
INSERT INTO public.indicateur_source (id, libelle) VALUES ('snbc', 'SNBC');
INSERT INTO public.indicateur_source_metadonnee (id, source_id, date_version, nom_donnees, diffuseur, producteur, methodologie, limites)
VALUES (3, 'snbc', '2024-07-11T00:00:00.000Z', 'SNBC', 'ADEME', 'ADEME', '', '');

-- Insertion de la source aldo
INSERT INTO public.indicateur_source (id, libelle) VALUES ('aldo', 'ALDO');
INSERT INTO public.indicateur_source_metadonnee (id, source_id, date_version, nom_donnees, diffuseur, producteur, methodologie, limites)
VALUES (4, 'aldo', '2024-09-01T00:00:00.000Z', '', 'CGDD', '', '', '');

-- Insertion de la source Insee
INSERT INTO public.indicateur_source(id, libelle, ordre_affichage) VALUES ('insee', 'INSEE', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.indicateur_source_metadonnee (id, source_id, date_version, nom_donnees, diffuseur, producteur, methodologie, limites)
VALUES (5, 'insee', '2020-01-01 00:00:00.000', '', 'CGDD', '', '', '');

-- Insertion de la valeur de population
insert into public.indicateur_definition(identifiant_referentiel, titre, unite, description) values (
    'terr_1', 'Population', 'nombre', 'Nombre d habitants par an.') ON CONFLICT DO NOTHING;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat,
                                      resultat_commentaire, objectif, objectif_commentaire)
values
((select id from indicateur_definition where identifiant_referentiel = 'terr_1' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01',
    (select id from public.indicateur_source_metadonnee where source_id = 'insee' and date_version = '2020-01-01T00:00:00.000Z' limit 1),
     41739, null, null, null);

-- Insertion pour le calcul de la trajectoire snbc. Cas du pays du Laon
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat,
                                      resultat_commentaire, objectif, objectif_commentaire)
values
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.c' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 56.729, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.d' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 41.448, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.i' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 19.760, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.g' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 28.860, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.e' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 102.045, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.f' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 1.039, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.h' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 3.371, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.j' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 807, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.e' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 334.7, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.f' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 247.25, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.i' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 24.77, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.g' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 402.75, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.h' limit 1),
     (select id from collectivite where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 3.82, null, null, null);


-- Insertion pour le calcul de la trajectoire snbc. Cas de strasbourg
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat,
                                      resultat_commentaire, objectif, objectif_commentaire)
values
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.c' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 447.868, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.c' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2019-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 430.23, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.d' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 471.107, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.d' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2019-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 428.27, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.i' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 348.525, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.i' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2019-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 459.29, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.g' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 28.839, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.g' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2019-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 23.66, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.e' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 653.598, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.e' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2019-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 668.93, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.f' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 21.492, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.f' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2019-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 20.72, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.h' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 39.791, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.h' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2019-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 50.66, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.j' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 13.500, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.j' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2019-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 11.09, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.e' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 3092.7, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.f' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 3295.15, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.i' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 61, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.g' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 2529.89, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.h' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 138.76, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.j' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 0, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_63.ca' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2018-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'aldo' and date_version = '2024-09-01T00:00:00.000Z' limit 1), -0.13844, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_63.db' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2018-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'aldo' and date_version = '2024-09-01T00:00:00.000Z' limit 1), -0.2279, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_63.b' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2018-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'aldo' and date_version = '2024-09-01T00:00:00.000Z' limit 1), 7.81264, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_63.e' limit 1),
     (select id from collectivite where siren = '246700488' limit 1),
        '2018-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'aldo' and date_version = '2024-09-01T00:00:00.000Z' limit 1), 0.62713, null, null, null);

-- Rhone agglo avec des données qui nécessitent une interpolation
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat,
                                      resultat_commentaire, objectif, objectif_commentaire)
values
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.c' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 54.086, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.d' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 42.286, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.i' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 50.905, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.g' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 24.645, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.e' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 55.465, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.f' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 1.314, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.h' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 0.474, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.j' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 0.273, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.e' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 389.67, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.f' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 221.32, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.i' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 18.77, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.g' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 214.13, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.h' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 6.13, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.j' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2014-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 7.39, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.j' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2016-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 7.47, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.j' limit 1),
     (select id from collectivite where siren = '200072015' limit 1),
        '2017-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 7.48, null, null, null);

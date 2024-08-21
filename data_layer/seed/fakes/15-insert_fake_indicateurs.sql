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
INSERT INTO public.indicateur_source_metadonnee (source_id, date_version, nom_donnees, diffuseur, producteur, methodologie, limites)
VALUES ('rare', '2024-07-18T00:00:00.000Z', '', 'OREC', '', 'Scope 1&2 (approche cadastrale)', '');

-- Insertion pour le calcul de la trajectoire snbc. Cas du pays du Laon
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat,
                                      resultat_commentaire, objectif, objectif_commentaire)
values
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.c' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 56729, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.d' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 41448, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.i' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 19760, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.g' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 28860, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.e' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 102045, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.f' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 1039, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.h' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 3371, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.j' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 807, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.e' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 334.7, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.f' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 247.25, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.i' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 24.77, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.g' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 402.75, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.h' limit 1),
     (select collectivite_id from epci where siren = '200043495' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 3.82, null, null, null);


-- Insertion pour le calcul de la trajectoire snbc. Cas de strasbourg
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat,
                                      resultat_commentaire, objectif, objectif_commentaire)
values
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.c' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 447868, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.d' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 471107, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.i' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 348525, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.g' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 28839, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.e' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 653598, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.f' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 21492, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.h' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 39791, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.j' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 13500, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.e' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 3092.7, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.f' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 3295.15, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.i' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 61, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.g' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 2529.89, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.h' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 138.76, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.j' limit 1),
     (select collectivite_id from epci where siren = '246700488' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 0, null, null, null);

-- Rhone agglo avec des données qui nécessitent une interpolation
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat,
                                      resultat_commentaire, objectif, objectif_commentaire)
values
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.c' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 54086, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.d' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 42286, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.i' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 50905, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.g' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 24645, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.e' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 55465, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.f' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 1314, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.h' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 474, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_1.j' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 273, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.e' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 389.67, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.f' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 221.32, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.i' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 18.77, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.g' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 214.13, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.h' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2015-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 6.13, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.j' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2014-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 7.39, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.j' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2016-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 7.47, null, null, null),
    ((select id from indicateur_definition where identifiant_referentiel = 'cae_2.j' limit 1),
     (select collectivite_id from epci where siren = '200072015' limit 1),
        '2017-01-01', (select id from public.indicateur_source_metadonnee where source_id = 'rare' and date_version = '2024-07-18T00:00:00.000Z' limit 1), 7.48, null, null, null);

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

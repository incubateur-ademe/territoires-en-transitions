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
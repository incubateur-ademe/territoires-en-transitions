insert into indicateur_personnalise_definition(id, collectivite_id, titre, description, unite, commentaire, modified_by)
values (0, 1, 'Mon indicateur perso' , 'Description', 'm2/hab',  'Mon commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

insert into indicateur_personnalise_resultat(collectivite_id, indicateur_id, valeur, annee)
values (1, 0 , 22.33, 2021);

insert into indicateur_personnalise_objectif(collectivite_id, indicateur_id, valeur, annee)
values (1, 0 , 23.33, 2021);
insert into indicateur_definition
values (default,
        'ind0',
        'cae',
        'r',
        null,
        'Radioactivité',
        'description',
        'sv',
        true,
        null);

insert into indicateur_personnalise_definition
values (default,
        1,
        1,
        'Voltage',
        'Tension',
        'V',
        'commentaire',
        '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

insert into fiche_action (titre, description, thematiques, piliers_eci, collectivite_id)
values
    (
        'fiche 1',
        'description',
        array[
            'Bâtiments'::fiche_action_thematiques
            ],
        array[
            'Écoconception'::fiche_action_piliers_eci,
            'Recyclage'::fiche_action_piliers_eci
            ],
        1
    ),
    ('fiche 2','description',array[]::fiche_action_thematiques[],array[]::fiche_action_piliers_eci[],1),
    ('fiche 3','description',array[]::fiche_action_thematiques[],array[]::fiche_action_piliers_eci[],2)
;

insert into axe (nom, collectivite_id, parent)
values ('Plan 1',1,null), -- id 1
       ('Axe 1.1', 1, 1), -- id 2
       ('Axe 1.2', 1, 1), -- id 3
       ('Axe 1.1.1', 1, 2), -- id 4
       ('Plan 2',2,null); -- id 5

select ajouter_fiche_action_dans_un_axe(1, 4);
select ajouter_fiche_action_dans_un_axe(2, 4);
select ajouter_fiche_action_dans_un_axe(3, 3);
select ajouter_fiche_action_dans_un_axe(1, 5);

select ajouter_partenaire(1, (select pt.*::partenaire_tag from (select null as id, 'part1' as nom, 1 as collectivite_id) pt limit 1));
select ajouter_partenaire(1, (select pt.*::partenaire_tag from (select null as id, 'part2' as nom, 1 as collectivite_id) pt limit 1));
select ajouter_partenaire(2, (select pt.*::partenaire_tag from (select null as id, 'part3' as nom, 2 as collectivite_id) pt limit 1));

select ajouter_structure(1, (select st.*::structure_tag from (select null as id, 'stru1' as nom, 1 as collectivite_id) st limit 1));
select ajouter_structure(1, (select st.*::structure_tag from (select null as id, 'stru2' as nom, 1 as collectivite_id) st limit 1));
select ajouter_structure(2, (select st.*::structure_tag from (select null as id, 'stru3' as nom, 2 as collectivite_id) st limit 1));

select ajouter_pilote(1, (select pe.*::personne from (select 'pe1' as nom, 1 as collectivite_id, null as personne_tag_id, null as utilisateur_uuid) pe limit 1));
select ajouter_pilote(1, (select pe.*::personne from (select null as nom, 1 as collectivite_id, null as personne_tag_id, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9' as utilisateur_uuid) pe limit 1));

select ajouter_referent(1, (select pe.*::personne from (select 'pe2' as nom, 1 as collectivite_id, null as personne_tag_id, null as utilisateur_uuid) pe limit 1));

select ajouter_action(1, 'eci_2.1');

select ajouter_indicateur(1, (select pe.*::indicateur_global from (select 'eci_5' as indicateur_id, null as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select ajouter_indicateur(2, (select pe.*::indicateur_global from (select null as indicateur_id, 1 as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));




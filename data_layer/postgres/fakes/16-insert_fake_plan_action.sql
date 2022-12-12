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
insert into partenaires_tags (nom, collectivite_id)
values ('ptag1', 1), ('ptag2', 1), ('ptag3', 2);

insert into structures_tags (nom, collectivite_id)
values ('stag1', 1), ('stag2', 2), ('stag3', 2);

insert into users_tags(nom, collectivite_id)
values ('user1', 1), ('user2', 1), ('user3', 2);

insert into plan_action (nom, collectivite_id, parent)
values ('Plan 1',1,null), -- id 1
       ('Plan 1.1', 1, 1), -- id 2
       ('Plan 1.2', 1, 1), -- id 3
       ('Plan 1.1.1', 1, 2), -- id 4
       ('Plan 2',2,null); -- id 5

select upsert_fiche_action_liens(
               1,
               array [1, 2],
               array [1],
               array[1],
               array['298235a0-60e7-4ceb-9172-0a991cce0386'::uuid],
               array[2],
               array[]::uuid[],
               array[]::integer[],
               array [3, 5],
               array[]::action_id[],
               array[]::indicateur_id[],
               array[]::integer[]
           );
select upsert_fiche_action_liens(
               2,
               array [1],
               array [1],
               array[2],
               array[]::uuid[],
               array[1],
               array[]::uuid[],
               array[]::integer[],
               array [4],
               array[]::action_id[],
               array[]::indicateur_id[],
               array[]::integer[]
           );
select upsert_fiche_action_plan_action(3, array [4]);


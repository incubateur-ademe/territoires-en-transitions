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

insert into fiche_action (id, titre, description, thematiques, piliers_eci, collectivite_id)
values
    (
        1,
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
    (2,'fiche 2','description',array[]::fiche_action_thematiques[],array[]::fiche_action_piliers_eci[],1),
    (3,'fiche 3','description',array[]::fiche_action_thematiques[],array[]::fiche_action_piliers_eci[],2)
;
insert into partenaires_tags (id, nom, collectivite_id)
values (1, 'ptag1', 1), (2, 'ptag2', 1), (3, 'ptag3', 2);

insert into structures_tags (id, nom, collectivite_id)
values (1, 'stag1', 1), (2, 'stag2', 2), (3, 'stag3', 2);

insert into users_tags(id, nom, collectivite_id)
values (1, 'user1', 1), (2, 'user2', 1), (3, 'user3', 2);

insert into plan_action
values (1,'Plan 1',1,null),
       (2, 'Plan 1.1', 1, 1),
       (3, 'Plan 1.2', 1, 1),
       (4, 'Plan 1.1.1', 1, 2),
       (5,'Plan 2',2,null);

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


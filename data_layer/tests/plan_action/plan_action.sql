begin;
select plan(10);

truncate table fiche_action cascade;

insert into fiche_action (id, titre, description, thematiques, piliers_eci, collectivite_id)
values
    (
       1,
       'fiche 1',
       'test description',
       array[
           'Bâtiments'::fiche_action_thematiques
        ],
       array[
           'Écoconception'::fiche_action_piliers_eci,
           'Recyclage'::fiche_action_piliers_eci
        ],
       1
    ),
    (2,'fiche 2','test description',array[]::fiche_action_thematiques[],array[]::fiche_action_piliers_eci[],1),
    (3,'fiche 3','test description',array[]::fiche_action_thematiques[],array[]::fiche_action_piliers_eci[],2)
;

select ok((select count(*)=1 from fiche_action), 'Il devrait y avoir une fiche action');

insert into partenaires_tags (id, nom, collectivite_id)
values (1, 'ptag1', 1), (2, 'ptag2', 1), (3, 'ptag3', 2);

insert into structures_tags (id, nom, collectivite_id)
values (1, 'stag1', 1), (2, 'stag2', 2), (3, 'stag3', 2);

insert into users_tags(id, nom, collectivite_id)
values (1, 'user1', 1), (2, 'user2', 1), (3, 'user3', 2);

-- TODO annexes
-- TODO plan actions
-- TODO indicateurs

select upsert_fiche_action_liens(
    1,
    array [1, 2],
    array [1],
    array[1],
    array['298235a0-60e7-4ceb-9172-0a991cce0386'::uuid],
    array[2],
    array[]::uuid[],
    array[]::integer[],
    array[]::integer[],
    array[]::action_id[]
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
    array[]::integer[],
    array[]::action_id[]
);

select ok ((select count(*)=3 from fiche_action_partenaires_tags),
    'Il devrait y avoir 3 entrées dans fiche_action_partenaires_tags');
select ok ((select count(*)=2 from fiche_action_structures_tags),
           'Il devrait y avoir 2 entrées dans fiche_action_structures_tags');
select ok ((select count(*)=3 from fiche_action_pilotes),
           'Il devrait y avoir 3 entrées dans fiche_action_pilotes');
select ok ((select count(*)=2 from fiche_action_referents),
           'Il devrait y avoir 2 entrées dans fiche_action_referents');
select ok ((select count(*)=0 from fiche_action_annexes),
           'Il devrait y avoir 0 entrées dans fiche_action_annexes');
select ok ((select count(*)=0 from fiche_action_plan_action),
           'Il devrait y avoir 0 entrées dans fiche_action_plan_action');
select ok ((select count(*)=0 from fiche_action_action),
           'Il devrait y avoir 0 entrées dans fiche_action_action');

select upsert_fiche_action_partenaires(1, array [2]);
select ok ((select count(*)=2 from fiche_action_partenaires_tags),
           'Il devrait y avoir 2 entrées dans fiche_action_partenaires_tags');

select ok ((select count(*)=3 from fiches_action),
            'Il devrait y avoir 3 entrées dans la vue');
rollback;
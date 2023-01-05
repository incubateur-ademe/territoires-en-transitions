begin;
select plan(16);

truncate fiche_action_annexe;
truncate annexe cascade;
truncate fiche_action_indicateur;
truncate fiche_action_action;
truncate fiche_action_referent;
truncate fiche_action_pilote;
truncate personne_tag cascade;
truncate fiche_action_structure_tag;
truncate structure_tag cascade;
truncate fiche_action_partenaire_tag;
truncate partenaire_tag cascade;
truncate fiche_action_axe;
truncate axe cascade;
truncate fiche_action cascade;

-- Test fiche_action
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
select ok((select count(*)=3 from fiche_action), 'Il devrait y avoir trois fiches action');

-- Test axe
insert into axe
values (1,'Test 1',1,null),
       (2, 'Test 1.1', 1, 1),
       (3, 'Test 1.2', 1, 1),
       (4, 'Test 1.1.1', 1, 2),
       (5,'Test 2',2,null);

select ok((select count(*)=5 from axe), 'Il devrait y avoir cinq axes');
select ajouter_fiche_action_dans_un_axe(1, 4);
select ajouter_fiche_action_dans_un_axe(2, 4);
select ajouter_fiche_action_dans_un_axe(3, 3);
select ajouter_fiche_action_dans_un_axe(1, 5);
select ajouter_fiche_action_dans_un_axe(2, 5);
select enlever_fiche_action_d_un_axe(2, 5);
select ok ((select count(*)=4 from fiche_action_axe),
           'Il devrait y avoir 4 entrées dans fiche_action_axe');

-- Test partenaire
select ajouter_partenaire(1, (select pt.*::partenaire_tag from (select null as id, 'part1' as nom, 1 as collectivite_id) pt limit 1));
select ajouter_partenaire(1, (select pt.*::partenaire_tag from (select null as id, 'part2' as nom, 1 as collectivite_id) pt limit 1));
select ajouter_partenaire(2, (select pt.*::partenaire_tag from (select null as id, 'part3' as nom, 2 as collectivite_id) pt limit 1));
select enlever_partenaire(3, (select ajouter_partenaire(3, (select pt.*::partenaire_tag from (select null as id, 'part4' as nom, 2 as collectivite_id) pt limit 1))));
select ok ((select count(*)=4 from partenaire_tag),
           'Il devrait y avoir 3 entrées dans partenaire_tag');
select ok ((select count(*)=3 from fiche_action_partenaire_tag),
    'Il devrait y avoir 3 entrées dans fiche_action_partenaire_tag');

-- Test structure
select ajouter_structure(1, (select st.*::structure_tag from (select null as id, 'stru1' as nom, 1 as collectivite_id) st limit 1));
select ajouter_structure(1, (select st.*::structure_tag from (select null as id, 'stru2' as nom, 1 as collectivite_id) st limit 1));
select ajouter_structure(2, (select st.*::structure_tag from (select null as id, 'stru3' as nom, 2 as collectivite_id) st limit 1));
select enlever_structure(3, (select ajouter_structure(3, (select st.*::structure_tag from (select null as id, 'stru4' as nom, 2 as collectivite_id) st limit 1))));
select ok ((select count(*)=4 from structure_tag),
           'Il devrait y avoir 4 entrées dans structure_tag');
select ok ((select count(*)=3 from fiche_action_structure_tag),
           'Il devrait y avoir 3 entrées dans fiche_action_structure_tag');

-- Test personne
select ajouter_pilote(1, (select pe.*::personne from (select 'pe1' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));
select ajouter_pilote(1, (select pe.*::personne from (select null as nom, 1 as collectivite_id, null as tag_id, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9' as user_id) pe limit 1));
select enlever_pilote(3, (select ajouter_pilote(3, (select pe.*::personne from (select 'pe2' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1))));
select ok ((select count(*)=2 from personne_tag),
           'Il devrait y avoir 2 entrées dans personne_tag');
select ok ((select count(*)=2 from fiche_action_pilote),
           'Il devrait y avoir 2 entrées dans fiche_action_pilote');
select enlever_referent(3, (select ajouter_referent(3, (select pe.*::personne from (select 'pe3' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1))));
select ajouter_referent(1, (select pe.*::personne from (select pt.nom, pt.collectivite_id, pt.id as tag_id, null as user_id from personne_tag pt where nom = 'pe2') pe limit 1));
select ok ((select count(*)=3 from personne_tag),
           'Il devrait y avoir 3 entrées dans personne_tag');
select ok ((select count(*)=1 from fiche_action_referent),
           'Il devrait y avoir 1 entrées dans fiche_action_referent');

-- Test annexe TODO
select ok ((select count(*)=0 from fiche_action_annexe),
           'Il devrait y avoir 0 entrées dans fiche_action_annexe');
-- Test action
select ajouter_action(1, 'eci_2.1');
select ajouter_action(3, 'eci_2.2');
select enlever_action(3, 'eci_2.2');
select ok ((select count(*)=1 from fiche_action_action),
           'Il devrait y avoir 1 entrées dans fiche_action_action');
-- Test indicateur
select ajouter_indicateur(1, (select pe.*::indicateur_global from (select 'eci_5' as indicateur_id, null as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select ajouter_indicateur(2, (select pe.*::indicateur_global from (select null as indicateur_id, 0 as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select ajouter_indicateur(3, (select pe.*::indicateur_global from (select 'eci_5' as indicateur_id, null as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select enlever_indicateur(3, (select pe.*::indicateur_global from (select 'eci_5' as indicateur_id, null as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select ok ((select count(*)=2 from fiche_action_indicateur),
           'Il devrait y avoir 2 entrées dans fiche_action_indicateur');

select ok ((select count(*)=3 from fiches_action),
            'Il devrait y avoir 3 entrées dans la vue');

select isnt_empty('select plan_action(1)', 'La fonction devrait retourner un jsonb');

update fiches_action
set objectifs = 'objectif'
where id=1;

rollback;

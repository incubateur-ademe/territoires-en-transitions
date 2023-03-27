begin;
select plan(34);

truncate fiche_action_financeur_tag;
truncate financeur_tag cascade;
truncate fiche_action_service_tag;
truncate service_tag cascade;
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
insert into fiche_action (id, titre, description, piliers_eci, collectivite_id, modified_by)
values
    (
        1,
        'fiche 1',
        'test description',
        array[
            'Écoconception'::fiche_action_piliers_eci,
            'Recyclage'::fiche_action_piliers_eci
            ],
        1,
        '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
    ),
    (2,'fiche 2','test description',array[]::fiche_action_piliers_eci[],1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
    (3,'fiche 3','test description',array[]::fiche_action_piliers_eci[],2, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9')
;
select ok((select count(*)=3 from fiche_action), 'Il devrait y avoir trois fiches action');

-- Test thematique
select ajouter_thematique(1, 'Activités économiques');
select ajouter_thematique(1, 'Énergie et climat');
select enlever_thematique (1, 'Énergie et climat');
select ok((select count(*)=1 from fiche_action_thematique), 'Il devrait y avoir une thématique');

select ajouter_sous_thematique(1, 1);
select ajouter_sous_thematique(1, 2);
select enlever_sous_thematique (1, 2);
select ok((select count(*)=1 from fiche_action_sous_thematique), 'Il devrait y avoir une sous_thématique');

-- Test axe
insert into axe (id, nom, collectivite_id, parent, modified_by)
values (1,'Test 1',1,null, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
       (2, 'Test 1.1', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
       (3, 'Test 1.2', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
       (4, 'Test 1.1.1', 1, 2, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
       (5,'Test 2',2,null, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

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

-- Test annexe
-- Un faux fichier.
select cb.collectivite_id,
       cb.bucket_id,
       'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9'            as hash,
       'yo.pdf'                                                                      as filename,
       jsonb_build_object('size', 34, 'mimetype', '*/*', 'cacheControl', 'no-cache') as metadata
into test.file
from collectivite_bucket cb
where collectivite_id = 1;

-- En tant que yolo
select test.identify_as('yolo@dodo.com');

-- On ajoute le fichier dans le bucket.
insert into storage.objects (bucket_id, name, owner, metadata)
select bucket_id, hash, auth.uid(), metadata
from test.file;

-- Puis à la bibliothèque
select add_bibliotheque_fichier(
               f.collectivite_id,
               f.hash,
               f.filename
           )
from test.file f;

insert into annexe (collectivite_id, fichier_id, url, fiche_id)
select collectivite_id, id, null, 1
from bibliotheque_fichier;

select ajouter_annexe((select a.*::annexe from (select null as id, bf.collectivite_id, bf.id as fichier_id, null as url, '' as titre, '' as commentaire, null as modified_by, null as modified_at, null as lien, 1 as fiche_id from bibliotheque_fichier bf limit 1) a limit 1));

select ok ((select count(*)=2 from annexe),
           'Il devrait y avoir 2 entrée dans annexe');
-- Test action
select ajouter_action(1, 'eci_2.1');
select ajouter_action(3, 'eci_2.2');
select enlever_action(3, 'eci_2.2');
select ok ((select count(*)=1 from fiche_action_action),
           'Il devrait y avoir 1 entrées dans fiche_action_action');
-- Test indicateur
select ajouter_indicateur(1, (select pe.*::indicateur_generique from (select 'eci_5' as indicateur_id, null as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select ajouter_indicateur(2, (select pe.*::indicateur_generique from (select null as indicateur_id, 0 as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select ajouter_indicateur(3, (select pe.*::indicateur_generique from (select 'eci_5' as indicateur_id, null as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select enlever_indicateur(3, (select pe.*::indicateur_generique from (select 'eci_5' as indicateur_id, null as indicateur_personnalise_id, null as nom, null as description, null as unite) pe limit 1));
select ok ((select count(*)=2 from fiche_action_indicateur),
           'Il devrait y avoir 2 entrées dans fiche_action_indicateur');

select ok ((select count(*)=3 from fiches_action),
           'Il devrait y avoir 3 entrées dans la vue');

select isnt_empty('select plan_action(1)', 'La fonction devrait retourner un jsonb');

update fiches_action
set objectifs = 'objectif'
where id=1;

select ok((select objectifs = 'objectif' from fiches_action where id = 1));

-- Test service
select ajouter_service(1, (select pt.*::service_tag from (select null as id, 'serv1' as nom, 1 as collectivite_id) pt limit 1));
select ajouter_service(1, (select pt.*::service_tag from (select null as id, 'serv2' as nom, 1 as collectivite_id) pt limit 1));
select ajouter_service(2, (select pt.*::service_tag from (select null as id, 'serv3' as nom, 2 as collectivite_id) pt limit 1));
select enlever_service(3, (select ajouter_service(3, (select pt.*::service_tag from (select null as id, 'serv4' as nom, 2 as collectivite_id) pt limit 1))));
select ok ((select count(*)=4 from service_tag),
           'Il devrait y avoir 3 entrées dans service_tag');
select ok ((select count(*)=3 from fiche_action_service_tag),
           'Il devrait y avoir 3 entrées dans fiche_action_service_tag');

-- Test financeur
select ajouter_financeur(1,(
select pt.*::financeur_montant
    from (
             select
                 (
                     select fi::financeur_tag
                     from (
                              select null as id,
                                     'fina1' as nom,
                                     1 as collectivite_id
                          ) fi
                 ) as financeur,
                 0 as montant_ttc,
                 null as id
         ) pt
    limit 1
));
select ajouter_financeur(1,(
    select pt.*::financeur_montant
    from (
             select
                 (
                     select fi::financeur_tag
                     from (
                              select null as id,
                                     'fina2' as nom,
                                     1 as collectivite_id
                          ) fi
                 ) as financeur,
                 10 as montant_ttc,
                 null as id
         ) pt
    limit 1
));
select ajouter_financeur(2,(
    select pt.*::financeur_montant
    from (
             select
                 (
                     select fi::financeur_tag
                     from (
                              select null as id,
                                     'fina3' as nom,
                                     2 as collectivite_id
                          ) fi
                 ) as financeur,
                 5 as montant_ttc,
                 null as id
         ) pt
    limit 1
));
delete from fiche_action_financeur_tag where fiche_id = 2;
select ok ((select count(*)=3 from financeur_tag),
           'Il devrait y avoir 3 entrées dans financeur_tag');
select ok ((select count(*)=2 from fiche_action_financeur_tag),
           'Il devrait y avoir 2 entrées dans fiche_action_financeur_tag');
-- VUE PLAN ACTION
select ok((select count(*)=2 from plan_action_profondeur), 'La fonction devrait retourner deux jsonb');
select ok((select count(*)=4 from plan_action_chemin where collectivite_id = 1), 'La fonction devrait retourner quatre chemins');

-- Test supression cascade
select enlever_fiche_action_d_un_axe(3, 3);
select ok ((select count(*)=1 from axe where id = 4),
           'L''axe id 4 devrait exister');
select ok ((select count(*)=1 from fiche_action where id = 1),
           'La fiche id 1 devrait exister');
select ok ((select count(*)=1 from fiche_action where id = 2),
           'La fiche id 2 devrait exister');
select ok ((select count(*)=2 from fiche_action_axe where fiche_id = 1),
           'La fiche id 1 devrait être dans 2 plans');
select delete_axe_all(1);
select ok ((select count(*)=0 from axe where id = 4),
           'L''axe id 4 ne devrait plus exister');
select ok ((select count(*)=1 from fiche_action where id = 1),
           'La fiche id 1 devrait toujours exister');
select ok ((select count(*)=1 from fiche_action_axe where fiche_id = 1),
           'La fiche id 1 devrait être dans 1 plan');
select ok ((select count(*)=0 from fiche_action where id = 2),
           'La fiche id 2 ne devrait plus exister');
select ok ((select count(*)=1 from fiche_action where id = 3),
           'La fiche id 3 devrait exister');

rollback;

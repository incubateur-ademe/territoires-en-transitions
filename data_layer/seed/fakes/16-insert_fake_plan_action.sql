truncate table axe cascade;

insert into axe (nom, collectivite_id, parent, modified_by)
values ('Plan Vélo 2020-2024',1,null, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 1
       ('Axe 1 : Sécurité : développer les aménagements cyclables et améliorer la sécurité routière', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 2
       ('Axe 2 : Sûreté : mieux lutter contre le vol', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 3
       ('Axe 3 : Créer un cadre incitatif reconnaissant pleinement l’usage du vélo comme un mode de transport vertueux', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 4
       ('Axe 4 : Développer une culture vélo', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 5
       ('4.1 : Pratiquer le vélo en toute sécurité', 1, 5, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 6
       ('4.2 : Déployer des plans de mobilité scolaires', 1, 5, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 7
       ('4.2.1 : Apprendre le vélo aux enfants', 1, 7, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 8
       ('4.2.1.1 : Faire passer permis vélo aux CM2', 1, 8, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 9
       ('4.3 : Développer l’activité physique pour la santé', 1, 5, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 10
       ('4.4 : Inclure de nouvelles mobilités dans l’organisation de la mobilité', 1, 5, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 11
       ('Plan Vélo 2024-2028',1,null, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 12
       ('Axe 1 : Sécurité : développer les aménagements cyclables et améliorer la sécurité routière', 1, 12, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 13
       ('Axe 2 : Sûreté : mieux lutter contre le vol', 1, 12, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 14
       ('Axe 3 : Créer un cadre incitatif reconnaissant pleinement l’usage du vélo comme un mode de transport vertueux', 1, 12, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 15
       ('Axe 4 : Développer une culture vélo', 1, 12, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 16
       ('4.1 : Pratiquer le vélo en toute sécurité', 1, 16, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 17
       ('4.2 : Déployer des plans de mobilité scolaires', 1, 16, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 18
       ('4.2.1 : Apprendre le vélo aux enfants', 1, 18, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 19
       ('4.2.1.1 : Faire passer permis vélo aux CM2', 1, 19, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 20
       ('4.3 : Développer l’activité physique pour la santé', 1, 16, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 21
       ('4.4 : Inclure de nouvelles mobilités dans l’organisation de la mobilité', 1, 16, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'); -- id 22


insert into fiche_action (titre, description, piliers_eci, collectivite_id, modified_by)
values ('Permis vélo CM2 école TET 2020-2024',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        array [
            'Écoconception'::fiche_action_piliers_eci,
            'Recyclage'::fiche_action_piliers_eci
            ],
        1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 1
       ('Casques et gilets réfléchissants gratuits pour les mineurs 2020-2024', '', array []::fiche_action_piliers_eci[],1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 2
       ('Course de vélo 2020-2024', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 3
       ('Ramassage scolaire à vélo 2020-2024', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 4
       ('Ajouter caméra de surveillance au parking à vélo 2020-2024', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 5,
       ('Arranger la piste cyclable 2020-2024', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 6
       ('Permis vélo CM2 école TET 2024-2028','', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 7
       ('Casques et gilets réfléchissants gratuits pour les mineurs 2024-2028', '', array []::fiche_action_piliers_eci[],1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 8
       ('Course de vélo 2024-2028', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 9
       ('Ramassage scolaire à vélo 2024-2028', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 10
       ('Ajouter caméra de surveillance au parking à vélo 2024-2028', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 11,
       ('Arranger la piste cyclable 2024-2028', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'), -- id 12
       ('Envoyer les nouvelles consignes de tri', '', array []::fiche_action_piliers_eci[], 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9') -- id 13
;

select private.ajouter_thematique(1, 'Activités économiques');
select private.ajouter_thematique(2, 'Activités économiques');
select private.ajouter_thematique(3, 'Activités économiques');
select private.ajouter_thematique(4, 'Activités économiques');
select private.ajouter_thematique(5, 'Activités économiques');
select private.ajouter_thematique(6, 'Activités économiques');
select private.ajouter_thematique(7, 'Activités économiques');
select private.ajouter_thematique(8, 'Activités économiques');
select private.ajouter_thematique(9, 'Activités économiques');
select private.ajouter_thematique(10, 'Activités économiques');
select private.ajouter_thematique(11, 'Activités économiques');
select private.ajouter_thematique(12, 'Activités économiques');
select private.ajouter_thematique(13, 'Activités économiques');

select private.ajouter_sous_thematique(1, 1);
select private.ajouter_sous_thematique(2, 1);
select private.ajouter_sous_thematique(3, 1);
select private.ajouter_sous_thematique(4, 1);
select private.ajouter_sous_thematique(5, 1);
select private.ajouter_sous_thematique(6, 1);
select private.ajouter_sous_thematique(7, 1);
select private.ajouter_sous_thematique(8, 1);
select private.ajouter_sous_thematique(9, 1);
select private.ajouter_sous_thematique(10, 1);
select private.ajouter_sous_thematique(11, 1);
select private.ajouter_sous_thematique(12, 1);
select private.ajouter_sous_thematique(13, 1);

insert into fiche_action_axe(fiche_id, axe_id)
values 
(1, 9),
(2, 6),
(3, 10),
(4, 4),
(5, 3),
(6, 2),
(7, 20),
(8, 17),
(9, 21),
(10, 15),
(11, 14),
(12, 13);

select private.ajouter_partenaire(1, (select pt.*::partenaire_tag from (select null as id, 'Super partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(1, (select pt.*::partenaire_tag from (select null as id, 'Ultra partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(2, (select pt.*::partenaire_tag from (select null as id, 'Giga partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(3, (select pt.*::partenaire_tag from (select null as id, 'Super partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(4, (select pt.*::partenaire_tag from (select null as id, 'Ultra partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(5, (select pt.*::partenaire_tag from (select null as id, 'Giga partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(6, (select pt.*::partenaire_tag from (select null as id, 'Super partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(7, (select pt.*::partenaire_tag from (select null as id, 'Ultra partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(7, (select pt.*::partenaire_tag from (select null as id, 'Giga partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(8, (select pt.*::partenaire_tag from (select null as id, 'Super partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(9, (select pt.*::partenaire_tag from (select null as id, 'Ultra partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(10, (select pt.*::partenaire_tag from (select null as id, 'Giga partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(11, (select pt.*::partenaire_tag from (select null as id, 'Giga partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(11, (select pt.*::partenaire_tag from (select null as id, 'Super partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(12, (select pt.*::partenaire_tag from (select null as id, 'Ultra partenaire' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_partenaire(13, (select pt.*::partenaire_tag from (select null as id, 'Giga partenaire' as nom, 1 as collectivite_id) pt limit 1));

select private.ajouter_structure(1, (select pt.*::structure_tag from (select null as id, 'Super structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(1, (select pt.*::structure_tag from (select null as id, 'Ultra structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(2, (select pt.*::structure_tag from (select null as id, 'Giga structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(3, (select pt.*::structure_tag from (select null as id, 'Super structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(4, (select pt.*::structure_tag from (select null as id, 'Ultra structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(5, (select pt.*::structure_tag from (select null as id, 'Giga structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(6, (select pt.*::structure_tag from (select null as id, 'Super structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(7, (select pt.*::structure_tag from (select null as id, 'Ultra structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(7, (select pt.*::structure_tag from (select null as id, 'Giga structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(8, (select pt.*::structure_tag from (select null as id, 'Super structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(9, (select pt.*::structure_tag from (select null as id, 'Ultra structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(10, (select pt.*::structure_tag from (select null as id, 'Giga structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(11, (select pt.*::structure_tag from (select null as id, 'Giga structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(11, (select pt.*::structure_tag from (select null as id, 'Super structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(12, (select pt.*::structure_tag from (select null as id, 'Ultra structure' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_structure(13, (select pt.*::structure_tag from (select null as id, 'Giga structure' as nom, 1 as collectivite_id) pt limit 1));

select private.ajouter_service(1, (select pt.*::service_tag from (select null as id, 'Super service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(1, (select pt.*::service_tag from (select null as id, 'Ultra service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(2, (select pt.*::service_tag from (select null as id, 'Giga service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(3, (select pt.*::service_tag from (select null as id, 'Super service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(4, (select pt.*::service_tag from (select null as id, 'Ultra service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(5, (select pt.*::service_tag from (select null as id, 'Giga service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(6, (select pt.*::service_tag from (select null as id, 'Super service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(7, (select pt.*::service_tag from (select null as id, 'Ultra service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(7, (select pt.*::service_tag from (select null as id, 'Giga service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(8, (select pt.*::service_tag from (select null as id, 'Super service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(9, (select pt.*::service_tag from (select null as id, 'Ultra service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(10, (select pt.*::service_tag from (select null as id, 'Giga service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(11, (select pt.*::service_tag from (select null as id, 'Giga service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(11, (select pt.*::service_tag from (select null as id, 'Super service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(12, (select pt.*::service_tag from (select null as id, 'Ultra service' as nom, 1 as collectivite_id) pt limit 1));
select private.ajouter_service(13, (select pt.*::service_tag from (select null as id, 'Giga service' as nom, 1 as collectivite_id) pt limit 1));

select private.ajouter_pilote(1, (select pe.*::personne from (select 'Lou Piote' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));
select private.ajouter_pilote(1, (select pe.*::personne from (select null as nom, 1 as collectivite_id, null as tag_id, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9' as user_id) pe limit 1));
select private.ajouter_pilote(2, (select pe.*::personne from (select 'Lou Piote' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));
select private.ajouter_pilote(3, (select pe.*::personne from (select 'Harry Cot' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));
select private.ajouter_pilote(4, (select pe.*::personne from (select 'Harry Cot' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));

select private.ajouter_referent(1, (select pe.*::personne from (select 'Harry Cot' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));
select private.ajouter_referent(2, (select pe.*::personne from (select null as nom, 1 as collectivite_id, null as tag_id, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9' as user_id) pe limit 1));
select private.ajouter_referent(4, (select pe.*::personne from (select 'Lou Piote' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));
select private.ajouter_referent(5, (select pe.*::personne from (select 'Harry Cot' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));
select private.ajouter_referent(6, (select pe.*::personne from (select 'Harry Cot' as nom, 1 as collectivite_id, null as tag_id, null as user_id) pe limit 1));

select private.ajouter_action(1, 'eci_2.1');
select private.ajouter_action(2, 'eci_2.1');
select private.ajouter_action(3, 'eci_2.1');
select private.ajouter_action(4, 'eci_2.1');
select private.ajouter_action(5, 'eci_2.1');

insert into personne_tag (nom, collectivite_id)
values ('Yo Low', 1),
       ('Judes Low', 1);

insert into structure_tag (nom, collectivite_id)
values ('Disneyland', 1),
       ('Parc Estérix', 1);

insert into partenaire_tag (nom, collectivite_id)
values ('Particulier', 1),
       ('Particulière', 1);

select private.ajouter_financeur(1,(select pt.*::financeur_montant from (select (select fi::financeur_tag from (select null as id, 'Balthazar Picsou' as nom, 1 as collectivite_id) fi) as financeur, 10000 as montant_ttc, null as id) pt limit 1));
select private.ajouter_financeur(1,(select pt.*::financeur_montant from (select (select fi::financeur_tag from (select null as id, 'Smaug' as nom, 1 as collectivite_id) fi) as financeur, 500 as montant_ttc, null as id) pt limit 1));
select private.ajouter_financeur(2,(select pt.*::financeur_montant from (select (select fi::financeur_tag from (select null as id, 'Balthazar Picsou' as nom, 1 as collectivite_id) fi) as financeur, 20000 as montant_ttc, null as id) pt limit 1));
select private.ajouter_financeur(2,(select pt.*::financeur_montant from (select (select fi::financeur_tag from (select null as id, 'Ras al Ghul' as nom, 1 as collectivite_id) fi) as financeur, 2000 as montant_ttc, null as id) pt limit 1));
select private.ajouter_financeur(3,(select pt.*::financeur_montant from (select (select fi::financeur_tag from (select null as id, 'Smaug' as nom, 1 as collectivite_id) fi) as financeur, 3000 as montant_ttc, null as id) pt limit 1));
select private.ajouter_financeur(4, (select pt.*::financeur_montant from (select (select fi::financeur_tag from (select null as id, 'Tony Stark' as nom, 1 as collectivite_id) fi) as financeur, 999 as montant_ttc, null as id) pt limit 1));

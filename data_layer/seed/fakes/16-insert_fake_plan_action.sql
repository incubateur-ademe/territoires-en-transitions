truncate table axe cascade;

insert into axe (nom, collectivite_id, parent, modified_by, plan)
values ('Plan Vélo 2020-2024',1,null, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 1
       ('Axe 1 : Sécurité : développer les aménagements cyclables et améliorer la sécurité routière', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 2
       ('Axe 2 : Sûreté : mieux lutter contre le vol', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 3
       ('Axe 3 : Créer un cadre incitatif reconnaissant pleinement l’usage du vélo comme un mode de transport vertueux', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 4
       ('Axe 4 : Développer une culture vélo', 1, 1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 5
       ('4.1 : Pratiquer le vélo en toute sécurité', 1, 5, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 6
       ('4.2 : Déployer des plans de mobilité scolaires', 1, 5, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 7
       ('4.2.1 : Apprendre le vélo aux enfants', 1, 7, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 8
       ('4.2.1.1 : Faire passer permis vélo aux CM2', 1, 8, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 9
       ('4.3 : Développer l’activité physique pour la santé', 1, 5, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 10
       ('4.4 : Inclure de nouvelles mobilités dans l’organisation de la mobilité', 1, 5, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1), -- id 11
       ('Plan Vélo 2024-2028',1,null, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 12
       ('Axe 1 : Sécurité : développer les aménagements cyclables et améliorer la sécurité routière', 1, 12, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 13
       ('Axe 2 : Sûreté : mieux lutter contre le vol', 1, 12, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 14
       ('Axe 3 : Créer un cadre incitatif reconnaissant pleinement l’usage du vélo comme un mode de transport vertueux', 1, 12, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 15
       ('Axe 4 : Développer une culture vélo', 1, 12, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 16
       ('4.1 : Pratiquer le vélo en toute sécurité', 1, 16, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 17
       ('4.2 : Déployer des plans de mobilité scolaires', 1, 16, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 18
       ('4.2.1 : Apprendre le vélo aux enfants', 1, 18, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 19
       ('4.2.1.1 : Faire passer permis vélo aux CM2', 1, 19, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 20
       ('4.3 : Développer l’activité physique pour la santé', 1, 16, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12), -- id 21
       ('4.4 : Inclure de nouvelles mobilités dans l’organisation de la mobilité', 1, 16, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 12); -- id 22

alter table fiche_action disable trigger save_history;
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
alter table fiche_action enable trigger save_history;

insert into fiche_action_thematique (fiche_id, thematique_id)
values
       (1, 1),
       (2, 1),
       (3, 1),
       (4, 1),
       (5, 1),
       (6, 1),
       (7, 1),
       (8, 1),
       (9, 1),
       (10, 1),
       (11, 1),
       (12, 1),
       (13, 1);

insert into fiche_action_sous_thematique (fiche_id, thematique_id)
values
       (1, 1),
       (2, 1),
       (3, 1),
       (4, 1),
       (5, 1),
       (6, 1),
       (7, 1),
       (8, 1),
       (9, 1),
       (10, 1),
       (11, 1),
       (12, 1),
       (13, 1);

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

-- Partenaires
insert into partenaire_tag (nom, collectivite_id)
values ('Super partenaire', 1),
       ('Ultra partenaire', 1),
       ('Giga partenaire', 1)
on conflict (nom, collectivite_id) do nothing;

insert into fiche_action_partenaire_tag (fiche_id, partenaire_tag_id)
values
    (1, (select id from partenaire_tag where nom = 'Super partenaire' and collectivite_id = 1)),
    (1, (select id from partenaire_tag where nom = 'Ultra partenaire' and collectivite_id = 1)),
    (2, (select id from partenaire_tag where nom = 'Giga partenaire' and collectivite_id = 1)),
    (3, (select id from partenaire_tag where nom = 'Super partenaire' and collectivite_id = 1)),
    (4, (select id from partenaire_tag where nom = 'Ultra partenaire' and collectivite_id = 1)),
    (5, (select id from partenaire_tag where nom = 'Giga partenaire' and collectivite_id = 1)),
    (6, (select id from partenaire_tag where nom = 'Super partenaire' and collectivite_id = 1)),
    (7, (select id from partenaire_tag where nom = 'Ultra partenaire' and collectivite_id = 1)),
    (7, (select id from partenaire_tag where nom = 'Giga partenaire' and collectivite_id = 1)),
    (8, (select id from partenaire_tag where nom = 'Super partenaire' and collectivite_id = 1)),
    (9, (select id from partenaire_tag where nom = 'Ultra partenaire' and collectivite_id = 1)),
    (10, (select id from partenaire_tag where nom = 'Giga partenaire' and collectivite_id = 1)),
    (11, (select id from partenaire_tag where nom = 'Giga partenaire' and collectivite_id = 1)),
    (11, (select id from partenaire_tag where nom = 'Super partenaire' and collectivite_id = 1)),
    (12, (select id from partenaire_tag where nom = 'Ultra partenaire' and collectivite_id = 1)),
    (13, (select id from partenaire_tag where nom = 'Giga partenaire' and collectivite_id = 1));

-- Structures
insert into structure_tag (nom, collectivite_id)
values ('Super structure', 1),
       ('Ultra structure', 1),
       ('Giga structure', 1)
on conflict (nom, collectivite_id) do nothing;

insert into fiche_action_structure_tag (fiche_id, structure_tag_id)
values
    (1, (select id from structure_tag where nom = 'Super structure' and collectivite_id = 1)),
    (1, (select id from structure_tag where nom = 'Ultra structure' and collectivite_id = 1)),
    (2, (select id from structure_tag where nom = 'Giga structure' and collectivite_id = 1)),
    (3, (select id from structure_tag where nom = 'Super structure' and collectivite_id = 1)),
    (4, (select id from structure_tag where nom = 'Ultra structure' and collectivite_id = 1)),
    (5, (select id from structure_tag where nom = 'Giga structure' and collectivite_id = 1)),
    (6, (select id from structure_tag where nom = 'Super structure' and collectivite_id = 1)),
    (7, (select id from structure_tag where nom = 'Ultra structure' and collectivite_id = 1)),
    (7, (select id from structure_tag where nom = 'Giga structure' and collectivite_id = 1)),
    (8, (select id from structure_tag where nom = 'Super structure' and collectivite_id = 1)),
    (9, (select id from structure_tag where nom = 'Ultra structure' and collectivite_id = 1)),
    (10, (select id from structure_tag where nom = 'Giga structure' and collectivite_id = 1)),
    (11, (select id from structure_tag where nom = 'Giga structure' and collectivite_id = 1)),
    (11, (select id from structure_tag where nom = 'Super structure' and collectivite_id = 1)),
    (12, (select id from structure_tag where nom = 'Ultra structure' and collectivite_id = 1)),
    (13, (select id from structure_tag where nom = 'Giga structure' and collectivite_id = 1));

-- Services
insert into service_tag (nom, collectivite_id)
values ('Super service', 1),
       ('Ultra service', 1),
       ('Giga service', 1)
on conflict (nom, collectivite_id) do nothing;

insert into fiche_action_service_tag (fiche_id, service_tag_id)
values
    (1, (select id from service_tag where nom = 'Super service' and collectivite_id = 1)),
    (1, (select id from service_tag where nom = 'Ultra service' and collectivite_id = 1)),
    (2, (select id from service_tag where nom = 'Giga service' and collectivite_id = 1)),
    (3, (select id from service_tag where nom = 'Super service' and collectivite_id = 1)),
    (4, (select id from service_tag where nom = 'Ultra service' and collectivite_id = 1)),
    (5, (select id from service_tag where nom = 'Giga service' and collectivite_id = 1)),
    (6, (select id from service_tag where nom = 'Super service' and collectivite_id = 1)),
    (7, (select id from service_tag where nom = 'Ultra service' and collectivite_id = 1)),
    (7, (select id from service_tag where nom = 'Giga service' and collectivite_id = 1)),
    (8, (select id from service_tag where nom = 'Super service' and collectivite_id = 1)),
    (9, (select id from service_tag where nom = 'Ultra service' and collectivite_id = 1)),
    (10, (select id from service_tag where nom = 'Giga service' and collectivite_id = 1)),
    (11, (select id from service_tag where nom = 'Giga service' and collectivite_id = 1)),
    (11, (select id from service_tag where nom = 'Super service' and collectivite_id = 1)),
    (12, (select id from service_tag where nom = 'Ultra service' and collectivite_id = 1)),
    (13, (select id from service_tag where nom = 'Giga service' and collectivite_id = 1));

-- Pilotes et référents
insert into personne_tag (nom, collectivite_id)
values ('Lou Piote', 1),
       ('Harry Cot', 1)
on conflict (nom, collectivite_id) do nothing;

insert into fiche_action_pilote (fiche_id, user_id, tag_id)
values
    (1, null, (select id from personne_tag where nom = 'Lou Piote' and collectivite_id = 1)),
    (1, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid, null),
    (2, null, (select id from personne_tag where nom = 'Lou Piote' and collectivite_id = 1)),
    (3, null, (select id from personne_tag where nom = 'Harry Cot' and collectivite_id = 1)),
    (4, null, (select id from personne_tag where nom = 'Harry Cot' and collectivite_id = 1));

insert into fiche_action_referent (fiche_id, user_id, tag_id)
values
    (1, null, (select id from personne_tag where nom = 'Harry Cot' and collectivite_id = 1)),
    (2, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid, null),
    (4, null, (select id from personne_tag where nom = 'Lou Piote' and collectivite_id = 1)),
    (5, null, (select id from personne_tag where nom = 'Harry Cot' and collectivite_id = 1)),
    (6, null, (select id from personne_tag where nom = 'Harry Cot' and collectivite_id = 1));

insert into fiche_action_action (fiche_id, action_id)
values
    (1, 'eci_2.1'),
    (2, 'eci_2.1'),
    (3, 'eci_2.1'),
    (4, 'eci_2.1'),
    (5, 'eci_2.1');

insert into personne_tag (nom, collectivite_id)
values ('Yo Low', 1),
       ('Judes Low', 1)
on conflict (nom, collectivite_id) do nothing;

insert into structure_tag (nom, collectivite_id)
values ('Disneyland', 1),
       ('Parc Estérix', 1)
on conflict (nom, collectivite_id) do nothing;

insert into partenaire_tag (nom, collectivite_id)
values ('Particulier', 1),
       ('Particulière', 1)
on conflict (nom, collectivite_id) do nothing;

-- Financeurs
insert into financeur_tag (nom, collectivite_id)
values ('Balthazar Picsou', 1),
       ('Smaug', 1),
       ('Ras al Ghul', 1),
       ('Tony Stark', 1)
on conflict (nom, collectivite_id) do nothing;

insert into fiche_action_financeur_tag (fiche_id, financeur_tag_id, montant_ttc)
values
    (1, (select id from financeur_tag where nom = 'Balthazar Picsou' and collectivite_id = 1), 10000),
    (1, (select id from financeur_tag where nom = 'Smaug' and collectivite_id = 1), 500),
    (2, (select id from financeur_tag where nom = 'Balthazar Picsou' and collectivite_id = 1), 20000),
    (2, (select id from financeur_tag where nom = 'Ras al Ghul' and collectivite_id = 1), 2000),
    (3, (select id from financeur_tag where nom = 'Smaug' and collectivite_id = 1), 3000),
    (4, (select id from financeur_tag where nom = 'Tony Stark' and collectivite_id = 1), 999);

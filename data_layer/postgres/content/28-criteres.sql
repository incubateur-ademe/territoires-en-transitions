insert into labellisation.etoile_meta
values ('1', '2','première étoile', '1ere étoile', 0),
       ('2', '3','deuxième étoile', '2eme étoile', 35),
       ('3', '4','troisième étoile', '3eme étoile', 50),
       ('4', '5','quatrième étoile', '4eme étoile', 65),
       ('5', null,'cinquième étoile', '5eme étoile', 75)
;

insert into critere_labellisation_action
values ('1', 1, 'eci', 'eci_1.1.1.1', 'Identifier un⸱e élu⸱e référent⸱e', 100, null),
       ('1', 1, 'cae', 'cae_5.1.1.1.3', 'Identifier un⸱e élu⸱e référent⸱e', 100, null),
       ('1', 2, 'eci', 'eci_1.1.1.3', 'Identifier une personne technique', 100, 100),
       ('1', 2, 'cae', 'cae_5.1.1.1.3', 'Identifier une personne technique', 100, 100),
       ('1', 3, 'eci', 'eci_1.1.1.3', 'Mettre en place une équipe projet', 100, 100),
       ('1', 3, 'cae', 'cae_5.1.1.3.2', 'Mettre en place une équipe projet', 100, 100),
       ('1', 4, 'eci', 'eci_1.1.2', 'Engager un diagnostic territorial', 20, null),
       ('1', 4, 'cae', 'cae_1.1.2', 'Engager un diagnostic territorial', 20, null)
;

insert into critere_labellisation_fichier
values ('eci', '1', 'Signer un acte d''engagement incluant le règlement du label'),
       ('cae', '1', 'Signer un acte d''engagement incluant le règlement du label')
;


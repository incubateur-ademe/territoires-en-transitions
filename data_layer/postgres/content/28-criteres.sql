insert into labellisation.etoile_meta
values ('1', '2','première étoile', '1ere étoile', 0),
       ('2', '3','deuxième étoile', '2eme étoile', 35),
       ('3', '4','troisième étoile', '3eme étoile', 50),
       ('4', '5','quatrième étoile', '4eme étoile', 65),
       ('5', null,'cinquième étoile', '5eme étoile', 75)
;

insert into labellisation_action_critere
values ('1', 1, 'eci', 'eci_1.1.1.1', 'Identifier un⸱e élu⸱e référent⸱e', 100, null),
       ('1', 1, 'cae', 'cae_5.1.1.1.3', 'Identifier un⸱e élu⸱e référent⸱e', 100, null),
       ('1', 2, 'eci', 'eci_1.1.1.3', 'Identifier une personne technique', 100, 100),
       ('1', 2, 'cae', 'cae_5.1.1.1.3', 'Identifier une personne technique', 100, 100),
       ('1', 3, 'eci', 'eci_1.1.1.3', 'Mettre en place une équipe projet', 100, 100),
       ('1', 3, 'cae', 'cae_5.1.1.3.2', 'Mettre en place une équipe projet', 100, 100),
       ('1', 4, 'eci', 'eci_1.1.2', 'Engager un diagnostic territorial', 20, null),
       ('1', 4, 'cae', 'cae_1.1.2', 'Engager un diagnostic territorial', 20, null),

--         ('1',5,'cae','cae_1.1.2.0.1','Être en conformité ou programmer la mise en conformité réglementaire vis-à-vis des obligations réglementaires PCAET',100,100),
--         ('1',6,'cae','cae_1.1.2.0.2','Être en conformité ou programmer la mise en conformité réglementaire vis-à-vis des obligations réglementaires BGES',100,100),

        ('1',5,'eci','eci_2.1.0','Respecter la réglementation PLPDMA',100,100),
        ('1',6,'eci','eci_2.2.0','Respecter la réglementation liée au système de collecte',100,100),
        ('1',7,'eci','eci_2.3.0','Respecter la règlementation concernant la valorisation des déchets (dont organiques)',100,100),
        ('1',8,'eci','eci_2.4.0','Respecter la règlementation sur les impacts environnementaux des émissions polluantes et les nuisances (olfactives, sonores....)',100,100),
        ('1',9,'eci','eci_3.2.0','Mettre en place le Schéma de promotion des achats publics socialement et écologiquement responsables (SPASER)' ,100,100),
        ('1',10,'eci','eci_4.1.0','Rédiger le rapport annuel SPPGD',100,100),
        ('2',1,'cae','cae_1.1.1.1.1','Avoir formalisé une vision et des engagements dans une décision de politique générale' ,100,null),
        ('2',1,'eci','eci_1.1.1.2','Avoir engagé la politique Économie Circulaire',100,null),

--         ('2',2,'cae','cae_1.1.2.0.1','Être en conformité ou programmer la mise en conformité réglementaire vis-à-vis des obligations réglementaires PCAET',100,null),
--         ('2',3,'cae','cae_1.1.2.0.2','Être en conformité ou programmer la mise en conformité réglementaire vis-à-vis des obligations réglementaires BGES',100,null),

        ('4',1,'eci','eci_2.1.0','Respecter la réglementation PLPDMA',100,null),
        ('4',2,'eci','eci_2.2.0','Respecter la réglementation liée au système de collecte',100,null),
        ('4',3,'eci','eci_2.3.0','Respecter la règlementation concernant la valorisation des déchets (dont organiques)',100,null),
        ('4',4,'eci','eci_2.4.0','Respecter la règlementation sur les impacts environnementaux des émissions polluantes et les nuisances (olfactives, sonores....)',100,null),
        ('4',5,'eci','eci_3.2.0','Mettre en place le Schéma de promotion des achats publics socialement et écologiquement responsables (SPASER)' ,100,null),
        ('4',6,'eci','eci_4.1.0','Rédiger le rapport annuel SPPGD',100,null)
;

insert into labellisation_fichier_critere
values ('eci', '1', 'Signer un acte d''engagement incluant le règlement du label'),
       ('cae', '1', 'Signer un acte d''engagement incluant le règlement du label')
;

insert into labellisation_calendrier
values ('eci',
        'Les prochaines sessions d’audit sont planifiées du 23 avril au 23 juin 2022 et du 5 novembre 2022 au 5 janvier 2023.'),
       ('cae',
        'Les prochaines sessions d’audit climat air énergie ... .')
;


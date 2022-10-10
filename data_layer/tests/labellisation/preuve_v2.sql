begin;

select plan(12);

truncate storage.objects cascade;
truncate labellisation.bibliotheque_fichier cascade;
truncate client_scores;

-- La collectivite doit avoir des scores pour apparaître dans la vue preuves
select test_write_scores(1);

select isnt_empty(
               'select * from preuve_reglementaire_definition;',
               'Le contenu des preuves règlementaires devrait être présent.'
           );

select isnt_empty(
               'select * '
                   'from preuve_action pa '
                   'join preuve_reglementaire_definition prd on prd.id = pa.preuve_id '
                   'where pa.preuve_id = ''pedibus''',
               'La définition de preuve règlementaire sur le pédibus devrait être présente et liée à une action.'
           );

select bag_eq(
               'select p.preuve_reglementaire ->> ''id'' as preuve_id, '
                   'p.action ->> ''action_id'' as action_id, '
                   'p.preuve_reglementaire ->> ''nom'' as nom '
                   'from preuve p '
                   'where collectivite_id = 1;',
               'select preuve_id, action_id, nom '
                   'from preuve_action pa '
                   'join preuve_reglementaire_definition prd on prd.id = pa.preuve_id;',
               'Toutes les preuves réglementaires devraient apparaître dans la vue preuve pour le client.'
           );

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

-- check l'insertion dans la bibliothèque qui est testée dans `fichier_preuve`
select isnt_empty('select * from bibliotheque_fichier');

-- Puis on attache le fichier à une action comme preuve complémentaire.
insert into preuve_complementaire (collectivite_id, fichier_id, url, action_id)
select collectivite_id, id, null, 'eci_1.1.1.1'
from bibliotheque_fichier;

-- On vérifie l'insertion.
select bag_eq(
               'select collectivite_id, fichier_id, modified_by, modified_at, action_id, lien from preuve_complementaire',
               'select collectivite_id, id, auth.uid(), now(), ''eci_1.1.1.1''::action_id, null::jsonb  from bibliotheque_fichier',
               'La preuve complémentaire devrait être insérée par Yolo'
           );

-- Puis la vue.
select bag_eq(
               'select collectivite_id, (fichier ->> ''hash'')::varchar(64), (action ->> ''action_id'')::action_id, lien from preuve where collectivite_id = 1 and preuve_type = ''complementaire''',
               'select p.collectivite_id, hash, action_id, lien
                from preuve_complementaire p
                    join bibliotheque_fichier bf on bf.id = p.fichier_id;'
           );


-- Yolo attache le fichier à une demande de labellisation.
-- Puis ajoute une demande pour eci, avec un id de 100
insert into labellisation.demande (id, collectivite_id, referentiel, etoiles)
values (100, 1, 'eci', '5');

-- Yolo ajoute la preuve à la demande
insert into preuve_labellisation (collectivite_id, fichier_id, demande_id)
select collectivite_id, id, 100
from bibliotheque_fichier;

select isnt_empty('select * from preuve_labellisation where demande_id = 100');

select bag_eq(
               'select (p.fichier ->> ''hash'')::varchar(64), p.collectivite_id, (p.demande ->> ''etoiles'')::labellisation.etoile
                from preuve p
                where collectivite_id = 1
                  and preuve_type = ''labellisation'';',
               'select bf.hash, pl.collectivite_id, ld.etoiles
                from preuve_labellisation pl
                         join bibliotheque_fichier bf on pl.fichier_id = bf.id
                         join labellisation.demande ld on pl.demande_id = ld.id;',
               'La vue preuve devrait contenir la preuve et la labellisation'
           );

-- Teste la fonction interne `critere_fichier` de la labellisation
select ok(
               (select atteint
                from labellisation.critere_fichier(1)
                where referentiel = 'eci'),
               'La collectivité devrait avoir atteint le critère fichier pour eci'
           );

select ok(
               (select atteint = false
                from labellisation.critere_fichier(1)
                where referentiel = 'cae'),
               'La collectivité ne devrait pas avoir atteint le critère fichier pour cae'
           );

-- Teste que les fichiers d'une collectivité ne soient pas présents dans la vue d'une autre collectivité
select isnt_empty(
               'select * from preuve p where collectivite_id = 1 and fichier is not null;',
               'La collectivité #1 devrait avoir des fichiers dans sa vue preuve'
           );

select is_empty(
               'select * from preuve p where collectivite_id = 2 and fichier is not null;',
               'La collectivité #2 ne devrait pas avoir de fichiers dans sa vue preuve'
           );

rollback;

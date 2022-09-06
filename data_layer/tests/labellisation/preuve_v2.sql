begin;

select plan(2);
truncate storage.objects cascade;
truncate labellisation.bibliotheque_fichier cascade;

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

-- Yolo ajoute le fichier dans le bucket.
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

-- Puis attache le fichier à une action comme preuve complémentaire.
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

rollback;

begin;

select plan(4);
select test.disable_evaluation_api();

truncate storage.objects cascade;
truncate labellisation.bibliotheque_fichier cascade;

-- Un faux fichier.
select cb.collectivite_id,
       cb.bucket_id,
       'e9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9'::varchar(64) as hash,
       'yo.pdf'                                                                        as filename,
       jsonb_build_object('size', 34, 'mimetype', '*/*', 'cacheControl', 'no-cache')   as metadata
into test.file
from collectivite_bucket cb
where collectivite_id = 1;


-- En tant que yolo
select test.identify_as('yolo@dodo.com');

-- Yolo ajoute un fichier pas encore dans le bucket de la collectivité.
select add_bibliotheque_fichier(
               f.collectivite_id,
               f.hash,
               f.filename
           )
from test.file f;

select is(
               (select current_setting('response.status')),
               ('404'),
               'La réponse lorsque le fichier ajouté n''existe pas devrait être 404'
           );

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

select is(
               (select current_setting('response.status')),
               ('201'),
               'La réponse lorsque le fichier est ajouté à la bibliothèque devrait être 201'
           );

select results_eq(
               'select collectivite_id, filename, hash from bibliotheque_fichier;',
               'select collectivite_id, filename, hash from test.file;',
               'le fichier devrait figurer dans la vue bibliothèque'
           );


-- En tant que Yulu qui n'est pas sur la collectivité 1.
select test.identify_as('yulu@dudu.com');

select add_bibliotheque_fichier(
               f.collectivite_id,
               f.hash,
               f.filename
           )
from test.file f;
select is(
               (select current_setting('response.status')),
               ('403'),
               'La réponse lorsque un non-membre de la collectivité tente d''ajouter un fichier devrait être 403'
           );

rollback;

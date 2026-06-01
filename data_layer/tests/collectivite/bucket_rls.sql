begin;
select plan(4);

truncate storage.objects cascade;

-- Prépare deux faux fichiers : un dans le bucket de la collectivité 1, un
-- dans celui de la collectivité 3.
insert into storage.objects (bucket_id, name, owner, metadata)
select cb.bucket_id,
       'private-collectivite-1.pdf',
       null,
       jsonb_build_object('size', 12, 'mimetype', 'application/pdf', 'cacheControl', 'no-cache')
from collectivite_bucket cb
where cb.collectivite_id = 1;

insert into storage.objects (bucket_id, name, owner, metadata)
select cb.bucket_id,
       'private-collectivite-3.pdf',
       null,
       jsonb_build_object('size', 12, 'mimetype', 'application/pdf', 'cacheControl', 'no-cache')
from collectivite_bucket cb
where cb.collectivite_id = 3;


-- En tant que yolo (admin sur la collectivité 1, aucun droit sur la 3)
select test.identify_as('yolo@dodo.com');

select isnt_empty(
       $$ select name from storage.objects where name = 'private-collectivite-1.pdf' $$,
       'Yolo (admin sur 1) doit pouvoir lire un fichier de son bucket'
   );

select is_empty(
       $$ select name from storage.objects where name = 'private-collectivite-3.pdf' $$,
       'Yolo ne doit PAS pouvoir lire un fichier d''une autre collectivité (3)'
   );


-- En tant que yulu (edition sur la collectivité 3 uniquement)
select test.identify_as('yulu@dudu.com');

select is_empty(
       $$ select name from storage.objects where name = 'private-collectivite-1.pdf' $$,
       'Yulu ne doit PAS pouvoir lire un fichier de la collectivité 1 (faille Pentest V5)'
   );

select isnt_empty(
       $$ select name from storage.objects where name = 'private-collectivite-3.pdf' $$,
       'Yulu (edition sur 3) doit pouvoir lire un fichier de son bucket'
   );

rollback;

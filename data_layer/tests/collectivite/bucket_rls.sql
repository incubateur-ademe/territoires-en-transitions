begin;
select plan(8);

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


-- En tant qu'utilisateur ADEME (email @ademe.fr), aucun droit sur 1 ni 3
do $$
declare
    new_user_id uuid := gen_random_uuid();
begin
    perform test_create_user(new_user_id, 'Ada', 'Lovelace', 'ada.lovelace@ademe.fr');
end
$$;

select test.identify_as('ada.lovelace@ademe.fr');

select isnt_empty(
       $$ select name from storage.objects where name = 'private-collectivite-1.pdf' $$,
       'Un utilisateur ADEME doit pouvoir lire un fichier de n''importe quelle collectivité (1)'
   );

select isnt_empty(
       $$ select name from storage.objects where name = 'private-collectivite-3.pdf' $$,
       'Un utilisateur ADEME doit pouvoir lire un fichier de n''importe quelle collectivité (3)'
   );


-- En tant que yala (lecture sur les collectivités 1, 2 et 3) : mode visite
select test.identify_as('yala@dada.com');

select isnt_empty(
       $$ select name from storage.objects where name = 'private-collectivite-1.pdf' $$,
       'Yala (lecture sur 1) doit pouvoir lire un fichier de son bucket en mode visite'
   );

select isnt_empty(
       $$ select name from storage.objects where name = 'private-collectivite-3.pdf' $$,
       'Yala (lecture sur 3) doit pouvoir lire un fichier de son bucket en mode visite'
   );

rollback;

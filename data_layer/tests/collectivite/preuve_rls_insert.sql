begin;
select plan(4);

select test.identify_as('yolo@dodo.com');
set local role authenticated;

select throws_ok(
       $$ insert into preuve_rapport (collectivite_id, url, titre, date)
          values (1, 'https://exemple.fr/rapport.pdf', 'Rapport de visite', now()) $$,
       '42501',
       'new row violates row-level security policy "deny_insert_client" for table "preuve_rapport"',
       'Yolo (admin sur 1) ne doit plus pouvoir déposer un rapport de visite depuis le client'
   );

select throws_ok(
       $$ insert into preuve_audit (collectivite_id, audit_id, url, titre)
          values (1, 1, 'https://exemple.fr/audit.pdf', 'Rapport d''audit') $$,
       '42501',
       'new row violates row-level security policy "deny_insert_client" for table "preuve_audit"',
       'Yolo (admin sur 1) ne doit plus pouvoir déposer un document d''audit depuis le client'
   );

reset role;

select lives_ok(
       $$ insert into preuve_rapport (collectivite_id, url, titre, date)
          values (1, 'https://exemple.fr/rapport.pdf', 'Rapport de visite', now()) $$,
       'Le propriétaire des tables, sous lequel le serveur se connecte, dépose toujours un rapport de visite'
   );

select lives_ok(
       $$ insert into preuve_audit (collectivite_id, audit_id, url, titre)
          values (1, 1, 'https://exemple.fr/audit.pdf', 'Rapport d''audit') $$,
       'Le propriétaire des tables, sous lequel le serveur se connecte, dépose toujours un document d''audit'
   );

rollback;

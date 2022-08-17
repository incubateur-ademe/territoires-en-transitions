begin;
select plan(2);

-- make uid work as if yolododo user is connected
select test.identify_as('yolo@dodo.com');

-- check that yolododo is included whithin the referents
select set_has(
               'select email from referent_contacts(1);',
               'select email from dcp where email = ''yolo@dodo.com'';',
               'Referents of collectivité #1 should contains yolododo.'
           );

-- when the collectivite has no referent yet
select is_empty(
               'select * from referent_contacts(10)',
               'Collectivité #10 referent contacts should be empty'
           );
rollback;

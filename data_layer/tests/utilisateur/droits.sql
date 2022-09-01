begin;
select plan(6);

-- make uid work as if yolododo user is connected
select test.identify_as('17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid);

truncate private_utilisateur_droit;

select is_empty(
               'select * from private_utilisateur_droit;',
               'private_utilisateur_droit should be empty.'
           );

select ialike(
               (claim_collectivite(10) -> 'message')::text,
               '%Vous êtes administrateur%',
               'should return the success message first time'
           );

select ialike(
               (claim_collectivite(10) -> 'message')::text,
               '%La collectivité dispose déjà d''un administrateur%',
               'should return the failure message the second time'
           );

select results_eq(
               'select count(*)::int as count from private_utilisateur_droit;',
               'select 1::int as count;',
               'private_utilisateur_droit should have one element.'
           );


select ialike(
               (claim_collectivite(11) -> 'message')::text,
               '%Vous êtes administrateur%',
               'should return the success message for the second collectivite'
           );

select results_eq(
               'select count(*)::int as count from private_utilisateur_droit;',
               'select 2::int as count;',
               'private_utilisateur_droit should have two elements.'
           );

rollback;

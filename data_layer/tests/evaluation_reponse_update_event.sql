begin;
select plan(4);

-- prepare
truncate personnalisation_consequence;
truncate reponse_update_event;
truncate public.personnalisation_regle;
truncate private_utilisateur_droit;
truncate private_utilisateur_droit;

alter table reponse_update_event disable row level security;

-- last update of personnalisation regles occured at 05:00 a.m.
insert into public.personnalisation_regle(action_id, type, formule, description,  modified_at) values ('cae_4.1.1', 'desactivation', 'si identite(type, commune) alors VRAI', 'Description de la règle', '2022-01-01 05:00:00.000000 +00:00');


-- collectivite #1 activated at 06:03 a.m.
insert into private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active, created_at) values ('17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1, 'admin', true, '2022-01-01 06:03:00.000000 +00:00');


-- [New activation should trigger personnalisation consequences computation]
-- when no personnalisation consequences yet] Should have one row per collectivite
select ok((select count(*) = 1
           from unprocessed_reponse_update_event
           where collectivite_id=1 and created_at='2022-01-01 06:03:00.000000 +00:00'),
          'View should have one row with collectivite_id=1 and created_at=06:03 a.m. (time of activation');


-- personnalisation consequences have been calculated at 08:00 a.m for collectivite #1 : view should be empty
insert into personnalisation_consequence(collectivite_id, consequences, modified_at) values (1, '{}', '2022-01-01 08:00:00.000000 +00:00');

select is_empty('select * from unprocessed_reponse_update_event where collectivite_id=1 ',
          'View should be empty if consequences have already been computed for the collectivite #1');


-- [Update response should trigger personnalisation consequences computation]
-- inserting a new reponse at 08:03 a.m => view should return one row with :  collectivite #1, 08:03 a.m.
insert into reponse_update_event(collectivite_id, created_at) values (1, '2022-01-01 08:03:00.000000 +00:00');
select ok((select count(*) = 1
           from unprocessed_reponse_update_event
           where collectivite_id=1 and created_at='2022-01-01 08:03:00.000000 +00:00'),
          'View should have one row with collectivite_id=1 and created_at=08:03 a.m. (time of reponse update');


-- [Update personnalisation regle should trigger personnalisation consequences computation]
-- Now, an update occured at 10:00 a.m. in the personnalisation regles
insert into public.personnalisation_regle(action_id, type, formule, description,  modified_at) values ('cae_4.1.2', 'desactivation', 'si identite(type, commune) alors FAUX', 'Description de la règle', '2022-01-01 10:00:00.000000 +00:00');


-- Hence, view should return one row with  created_at 10:00 a.m. (last referentiel update)
select ok((select count(*) = 1
           from unprocessed_reponse_update_event
           where collectivite_id=1 and created_at='2022-01-01 10:00:00.000000 +00:00'),
          'View should have only one row'
           );

rollback;

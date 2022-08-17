begin;
select plan(8);

-- prepare
truncate client_scores;
truncate action_statut;
truncate private_utilisateur_droit;
truncate action_computed_points;

-- last referentiel computed points update occured at 05:00 a.m.
insert into action_computed_points(action_id, value, modified_at) values ('eci', 500.0, '2022-01-01 05:00:00.000000 +00:00');
insert into action_computed_points(action_id, value, modified_at) values ('cae', 500.0, '2022-01-01 05:00:00.000000 +00:00');


-- collectivite #1 activated at 06:03 a.m.
insert into private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active, created_at) values ('17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 1, 'admin', true, '2022-01-01 06:03:00.000000 +00:00');


-- [WHEN NO SCORES YET] Should have one row per referentiel and per collectivite
select ok((select count(*) = 1
           from unprocessed_action_statut_update_event
          where collectivite_id=1 and referentiel='eci' and created_at='2022-01-01 06:03:00.000000 +00:00'),
          'View should have one row with referentiel=eci, collectivite_id=1 and created_at=06:03 a.m. (time of activation');
select ok((select count(*) = 1
           from unprocessed_action_statut_update_event
          where collectivite_id=1 and referentiel='cae' and created_at='2022-01-01 06:03:00.000000 +00:00'),
          'View should have one row with referentiel=cae, collectivite_id=1 and created_at=06:03 a.m. (time of activation');


-- client scores have been calculated at 08:00 a.m for both ECI and CAE; collectivite #1 inserted a new statut in CAE at  08:03 a.m.
-- view should return one row with :  collectivite #1, referentiel CAE, 08:03 a.m.
insert into client_scores values (1, 'cae', '{}', '2022-01-01 08:00:00.000000 +00:00');
insert into client_scores values (1, 'eci', '{}', '2022-01-01 08:00:00.000000 +00:00');

insert into action_statut(collectivite_id, action_id, avancement, concerne, modified_by, modified_at)
       values (1, 'cae_1.1.1.1.1', 'fait', true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', '2022-01-01 08:03:00.000000 +00:00');

-- [UPDATE STATUT SHOULD TRIGGER EVALUATION ]
-- view should have only one row with referentiel=eci, created_at 08:03 a.m. (last status update)
select ok((select count(*) = 1
           from unprocessed_action_statut_update_event),
          'View should have only one row'
           );
select ok((select count(*) = 1
           from unprocessed_action_statut_update_event
           where referentiel='cae' and created_at='2022-01-01 08:03:00.000000 +00:00'),
          'Referentiel=eci, created_at 08:03 a.m. (last status update)'
           );

-- Now, if scores are calculated at 08:05 a.m. for CAE, view should become empty
update client_scores set score_created_at='2022-01-01 08:05:00.000000 +00:00' where collectivite_id = 1 and referentiel='cae';
select is_empty('select * from unprocessed_action_statut_update_event',
                'If last scores were calculated later then last statut update, view is empty');

-- [UPDATE REFERENTIEL SHOULD TRIGGER EVALUATION ]
-- Now, an update occured at 09:00 a.m. in the referentiel computed points of ECI
truncate action_computed_points;
insert into action_computed_points(action_id, value, modified_at) values ('eci', 500.0, '2022-01-01 09:00:00.000000 +00:00');


-- Hence, view should return one row with referentiel=eci, created_at 09:00 a.m. (last referentiel update)
select ok((select count(*) = 1
           from unprocessed_action_statut_update_event),
          'View should have only one row'
           );
select ok((select count(*) = 1
           from unprocessed_action_statut_update_event
           where referentiel='eci' and created_at='2022-01-01 09:00:00.000000 +00:00'),
          'Referentiel=eci, created_at 09:00 a.m. (last referentiel update)'
           );

-- [ACTIVATING A COLLECTIVITE SHOULD TRIGGER EVALUATION ]
-- Collectivite #2 activated at 10:00 a.m.
insert into private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active, created_at) values ('17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 2, 'admin', true,'2022-01-01 10:00:00.000000 +00:00');
select ok((select count(*) = 2
           from unprocessed_action_statut_update_event
           where collectivite_id='2' and created_at='2022-01-01 10:00:00.000000 +00:00'),
          'Two rows (one per referentiel) for collectivite=2, created_at 09:00 a.m. (activation date)'
           );
rollback;

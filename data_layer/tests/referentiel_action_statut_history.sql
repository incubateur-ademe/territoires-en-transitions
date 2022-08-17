begin;
select plan(2);

drop trigger if exists set_modified_at_action_statut_update on action_statut;

truncate action_statut;
truncate historique.action_statut;
select test.identify_as('yolo@dodo.com');

insert into action_statut(collectivite_id, action_id, avancement, concerne, modified_at)
values (1, 'cae_1.1.1.1.1', 'fait', true, '2022-09-09');


select test.identify_as('yili@didi.com');
insert into action_statut(collectivite_id, action_id, avancement, concerne, modified_at)
values (1, 'cae_1.1.1.1.1', 'programme', true, '2022-09-10')
on conflict (collectivite_id, action_id)
    do update set avancement  = excluded.avancement,
                  modified_by = excluded.modified_by,
                  modified_at = excluded.modified_at;

select ok((select count(*) = 2 from historique.action_statut));


select *
into expected_history
from historique.action_statut
where false;
insert into expected_history(id, collectivite_id, action_id, avancement, previous_avancement, avancement_detaille,
                             previous_avancement_detaille, concerne, previous_concerne, modified_by,
                             previous_modified_by, modified_at, previous_modified_at)
values (3, 1, 'cae_1.1.1.1.1', 'fait', null, null, null, true, null, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', null,
        '2022-09-09 00:00:00.000000 +00:00', null),
       (4, 1, 'cae_1.1.1.1.1', 'programme', 'fait', null, null, true, true, '3f407fc6-3634-45ff-a988-301e9088096a',
        '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', '2022-09-10 00:00:00.000000 +00:00',
        '2022-09-09 00:00:00.000000 +00:00');

select set_eq(
               'select collectivite_id, action_id, avancement, previous_avancement, avancement_detaille, previous_avancement_detaille, concerne, previous_concerne, modified_by, previous_modified_by, modified_at, previous_modified_at from historique.action_statut',
               'select collectivite_id, action_id, avancement, previous_avancement, avancement_detaille, previous_avancement_detaille, concerne, previous_concerne, modified_by, previous_modified_by, modified_at, previous_modified_at from expected_history',
               'L''historique doit être égale à la version prévue.');

rollback;

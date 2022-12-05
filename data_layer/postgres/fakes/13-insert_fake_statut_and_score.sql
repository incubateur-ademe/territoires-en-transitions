-- insert a fake statut.
-- depends on:
-- - 11-insert_fake_epcis.sql
-- - 10-insert_fake_user.sql
insert into
    action_statut(collectivite_id, action_id, avancement, concerne, modified_by, modified_at)
    values (1, 'cae_1.1.1.1.1', 'fait', true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', now() - interval '1 month');

insert into
    action_statut(collectivite_id, action_id, avancement, avancement_detaille, concerne, modified_by, modified_at)
    values (1, 'cae_1.1.1.1.2', 'detaille', '{ 0.2, 0.7, 0.1}' , true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',now() - interval '1 month');

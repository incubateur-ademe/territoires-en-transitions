-- insert a fake statut.
-- depends on:
-- - 11-insert_fake_epcis.sql
-- - 12-insert_fake_referentiel.sql
-- - 10-insert_fake_user.sql
insert into
    action_statut(epci_id, action_id, avancement, concerne, modified_by)
    values (1, 'cae_1', 'fait', true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');



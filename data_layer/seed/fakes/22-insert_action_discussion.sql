insert into action_discussion(collectivite_id, action_id, created_by)
values
        (1, 'eci_2.2', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
        (1, 'eci_2.3', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');

insert into action_discussion_commentaire(discussion_id, message, created_by)
values
        ((select id from action_discussion where action_id='eci_2.2' limit 1), 'message a', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
        ((select id from action_discussion where action_id='eci_2.2' limit 1), 'message b', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'),
        ((select id from action_discussion where action_id='eci_2.3' limit 1), 'message c', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');


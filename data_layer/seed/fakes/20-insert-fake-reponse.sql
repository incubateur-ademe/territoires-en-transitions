-- Repone binaire 
insert into reponse_binaire(collectivite_id, question_id, reponse, modified_at)
values (1, 'dechets_1', false, '2020-01-01 00:00:00');
insert into reponse_binaire(collectivite_id, question_id, reponse, modified_at)
values (1, 'dechets_1', true, '2020-01-01 00:00:01') on conflict (collectivite_id, question_id) do update
set reponse = excluded.reponse,
    modified_at = excluded.modified_at;

-- Reponse proportion
insert into reponse_proportion(collectivite_id, question_id, reponse, modified_at)
values (1, 'habitat_2', 0.7, '2020-01-01 00:00:00');
insert into reponse_proportion(collectivite_id, question_id, reponse, modified_at)
values (1, 'habitat_2', 0.8, '2020-01-01 00:00:01') on conflict (collectivite_id, question_id) do update
set reponse = excluded.reponse,
    modified_at = excluded.modified_at;

-- Reponse choix
insert into reponse_choix(collectivite_id, question_id, reponse, modified_at)
values (1, 'EP_1', 'EP_1_a', '2020-01-01 00:00:00');
insert into reponse_choix(collectivite_id, question_id, reponse, modified_at)
values (1, 'EP_1', 'EP_1_b', '2020-01-01 00:00:01') on conflict (collectivite_id, question_id) do update
set reponse = excluded.reponse,
    modified_at = excluded.modified_at;
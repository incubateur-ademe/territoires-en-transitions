-- Repone binaire 
insert into reponse_binaire(collectivite_id, question_id, reponse)
values (1, 'dechets_1', true);

-- Reponse proportion
insert into reponse_proportion(collectivite_id, question_id, reponse)
values (1, 'habitat_2', 0.8);

-- Reponse choix
insert into reponse_choix(collectivite_id, question_id, reponse)
values (1, 'EP_1', 'EP_1_b');
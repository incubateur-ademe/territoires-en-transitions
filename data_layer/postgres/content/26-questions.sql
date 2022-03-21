-- Thematiques
insert into question_thematique values ('mobilite', 'Mobilité');
insert into question_thematique values ('dechets', 'Déchets');
insert into question_thematique values ('energie', 'Énergie');

-- Questions
insert into question (id, thematique_id, type, description, formulation) values ('energie_1', 'energie', 'proportion', '', 'Quelle est la part de la collectivité dans la structure compétente en matière d''éclairage public ?');
insert into question (id, thematique_id, type, description, formulation) values ('energie_2', 'energie', 'proportion', '', 'La collectivité a-t-elle la compétence éclairage public ?');
insert into question (id, thematique_id, type, description, formulation) values ('mobilite_1', 'mobilite', 'choix', '', 'La collectivité a-t-elle la compétence voirie ?');
insert into question (id, thematique_id, type, description, formulation) values ('mobilite_2', 'mobilite', 'proportion', '', 'Quel est le taux de participation de la collectivité à la collectivité autorité organisatrice de la mobilité (AOM) ?');
insert into question (id, thematique_id, type, description, formulation) values ('dechets_1', 'dechets', 'binaire', '', 'La collectivité a-t-elle la compétence "collecte des déchets" ?');
insert into question (id, thematique_id, type, description, formulation) values ('dechets_2', 'dechets', 'binaire', '', 'La collectivité a-t-elle la compétence "traitement des déchets" ?');
insert into question (id, thematique_id, type, description, formulation) values ('dechets_3', 'dechets', 'binaire', '', 'La collectivité est-elle chargée de la réalisation d''un "Programme local de prévention des déchets ménagers et assimilés" (PLPDMA) du fait de sa compétence collecte et/ou par délégation d''une autre collectivité ?');
insert into question (id, thematique_id, type, description, formulation) values ('dechets_4', 'dechets', 'binaire', '', 'La collectivité a-t-elle mise en place la redevance d’enlèvement des ordures ménagères (REOM) ?');

-- Questions Actions
insert into question_action (question_id, action_id) values ('energie_1', 'cae_2.3.1');
insert into question_action (question_id, action_id) values ('energie_2', 'cae_2.3.1');
insert into question_action (question_id, action_id) values ('mobilite_1', 'cae_2.3.3');
insert into question_action (question_id, action_id) values ('mobilite_2', 'cae_4.1.1');
insert into question_action (question_id, action_id) values ('dechets_1', 'eci_2');
insert into question_action (question_id, action_id) values ('dechets_2', 'eci_2');
insert into question_action (question_id, action_id) values ('dechets_3', 'eci_2');
insert into question_action (question_id, action_id) values ('dechets_4', 'eci_4');

-- Qustion Choix
insert into question_choix (question_id, id, formulation) values ('mobilite_1', 'mobilite_1_a', 'Oui, uniquement sur trottoirs, parkings ou zones d''activités ou industrielles');
insert into question_choix (question_id, id, formulation) values ('mobilite_1', 'mobilite_1_b', 'non');


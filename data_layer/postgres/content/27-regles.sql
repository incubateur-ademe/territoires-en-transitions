insert into personnalisation_regle (action_id, type, formule, description) values ('cae_4.1.1', 'reduction', 'si reponse(mobilite_1, OUI) alors max(reponse(mobilite_2), 0.5) 
', '<p>Pour une collectivité AOM, la réduction est proportionnelle</p>
<p>à la participation dans la collectivité AOM dans la limite de 5 points (50%)</p>
');
insert into personnalisation_regle (action_id, type, formule, description) values ('cae_3.3.5', 'score', 'min(score(cae_1.2.3), score(cae_3.3.5 )) 
', '<p>Score de la 3.3.5 ne peut pas dépasser le score de la 1.2.3</p>
');
insert into personnalisation_regle (action_id, type, formule, description) values ('eci_2.1', 'desactivation', 'reponse(dechets_1, NON) ou reponse(dechets_3, NON) 
', '<p>L’action eci_2.1 est désactivée si la collectivité n''a pas la</p>
<p>compétence collecte de déchets ou si elle n''est pas chargée</p>
<p>d''un programme PLPDMA</p>
');
insert into personnalisation_regle (action_id, type, formule, description) values ('eci_2.2', 'desactivation', 'reponse(dechets_1, NON) 
', '');
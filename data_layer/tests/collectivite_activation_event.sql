begin;
select plan(2);

truncate table private_utilisateur_droit;
truncate table collectivite_activation_event;

-- Activation de la collectivité 23 par Yolo
insert into private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active) VALUES ('17440546-f389-4d4f-bfdb-b0c94a1bd0f9', 23, 'edition', TRUE);

select isnt_empty(
               'select * from collectivite_activation_event where collectivite_id = 23',
               'L''évènement a été créé.'
           );

-- Deuxième droit (Yili) pour la collectivité 23 (déjà activée)
insert into private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active) VALUES ('3f407fc6-3634-45ff-a988-301e9088096a', 23, 'edition', TRUE);

select ok((select count(*) = 1 from collectivite_activation_event where collectivite_id = 23), 'L''évènement n''a pas été créé pour une collectivité déjà activée.');
rollback;

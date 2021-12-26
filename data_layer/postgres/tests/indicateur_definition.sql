-- depends on action relation initial data.
insert into indicateur_definition(id, indicateur_group, identifiant, valeur_indicateur, nom, description, unite, obligation_eci, parent) values ('indicateur_1', 'eci', '', null, '', 'l''ademe !', '', false ,   null);
insert into indicateur_action(indicateur_id, action_id) values ('indicateur_1', 'eci_1');

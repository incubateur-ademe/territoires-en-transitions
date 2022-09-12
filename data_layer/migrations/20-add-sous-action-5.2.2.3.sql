BEGIN; 

-- Move cae_5.2.2.8 children into cae_5.2.2.9 children
select private.move_action_data('cae_5.2.2.8', 'cae_5.2.2.9');
select private.move_action_data('cae_5.2.2.8.1', 'cae_5.2.2.9.1');
select private.move_action_data('cae_5.2.2.8.2', 'cae_5.2.2.9.2');


-- Move cae_5.2.2.7 into cae_5.2.2.8
select private.move_action_data('cae_5.2.2.7', 'cae_5.2.2.8');

-- Move cae_5.2.2.6 children into cae_5.2.2.7 children
select private.move_action_data('cae_5.2.2.6', 'cae_5.2.2.7');
select private.move_action_data('cae_5.2.2.6.1', 'cae_5.2.2.7.1');
select private.move_action_data('cae_5.2.2.6.2', 'cae_5.2.2.7.2');
select private.move_action_data('cae_5.2.2.6.3', 'cae_5.2.2.7.3');
select private.move_action_data('cae_5.2.2.6.4', 'cae_5.2.2.7.4');
select private.move_action_data('cae_5.2.2.6.5', 'cae_5.2.2.7.5');
select private.move_action_data('cae_5.2.2.6.6', 'cae_5.2.2.7.6');
select private.move_action_data('cae_5.2.2.6.7', 'cae_5.2.2.7.7');

-- Move cae_5.2.2.5 children into cae_5.2.2.6 children
select private.move_action_data('cae_5.2.2.5', 'cae_5.2.2.6');
select private.move_action_data('cae_5.2.2.5.1', 'cae_5.2.2.6.1');
select private.move_action_data('cae_5.2.2.5.2', 'cae_5.2.2.6.2');
select private.move_action_data('cae_5.2.2.5.3', 'cae_5.2.2.6.3');

-- Move cae_5.2.2.4 children into cae_5.2.2.5 children
select private.move_action_data('cae_5.2.2.4', 'cae_5.2.2.5');
select private.move_action_data('cae_5.2.2.4.1', 'cae_5.2.2.5.1');
select private.move_action_data('cae_5.2.2.4.2', 'cae_5.2.2.5.2');

-- Move cae_5.2.2.3 children into cae_5.2.2.4 children
select private.move_action_data('cae_5.2.2.3', 'cae_5.2.2.4');
select private.move_action_data('cae_5.2.2.3.1', 'cae_5.2.2.4.1');
select private.move_action_data('cae_5.2.2.3.2', 'cae_5.2.2.4.2');
select private.move_action_data('cae_5.2.2.3.3', 'cae_5.2.2.4.3');


-- Move preuve fichiers 
update preuve_fichier set action_id = 'cae_5.2.2.9' where action_id = 'cae_5.2.2.8';
update preuve_fichier set action_id = 'cae_5.2.2.8' where action_id = 'cae_5.2.2.7';
update preuve_fichier set action_id = 'cae_5.2.2.7' where action_id = 'cae_5.2.2.6';
update preuve_fichier set action_id = 'cae_5.2.2.6' where action_id = 'cae_5.2.2.5';
update preuve_fichier set action_id = 'cae_5.2.2.5' where action_id = 'cae_5.2.2.4';
update preuve_fichier set action_id = 'cae_5.2.2.4' where action_id = 'cae_5.2.2.3';

-- Remove definitions
delete from action_definition where action_id in ('cae_5.2.2.5.3', 'cae_5.2.2.3.1', 'cae_5.2.2.3.2',  'cae_5.2.2.6.4', 'cae_5.2.2.6.5', 'cae_5.2.2.6.6', 'cae_5.2.2.6.7', 'cae_5.2.2.3.3', 'cae_5.2.2.8.1', 'cae_5.2.2.8.2'); 
delete from action_computed_points where action_id in ('cae_5.2.2.5.3', 'cae_5.2.2.3.1', 'cae_5.2.2.3.2', 'cae_5.2.2.6.4', 'cae_5.2.2.6.5', 'cae_5.2.2.6.6', 'cae_5.2.2.6.7', 'cae_5.2.2.3.3', 'cae_5.2.2.8.1', 'cae_5.2.2.8.2'); 
delete from action_relation where id  in ('cae_5.2.2.5.3', 'cae_5.2.2.3.1', 'cae_5.2.2.3.2', 'cae_5.2.2.6.4', 'cae_5.2.2.6.5', 'cae_5.2.2.6.6', 'cae_5.2.2.6.7', 'cae_5.2.2.3.3', 'cae_5.2.2.8.1', 'cae_5.2.2.8.2'); 


COMMIT; 
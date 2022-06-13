-- execute 38-migration_contenu.sql
select private.remove_action_data('cae_6.5.1.1.1');
select private.move_action_data('cae_6.5.1.1.2', 'cae_6.5.1.1.1'); 
select private.move_action_data('cae_6.5.1.1.3', 'cae_6.5.1.1.2'); 
select private.move_action_data('cae_6.5.1.1.4', 'cae_6.5.1.1.3'); 
select private.move_action_data('cae_6.5.1.1.5', 'cae_6.5.1.1.4'); 

-- Remove action cae_6.5.1.1.5
delete from action_definition where action_id = 'cae_6.5.1.1.5'; 
delete from action_computed_points where action_id = 'cae_6.5.1.1.5'; 
delete from action_relation where id = 'cae_6.5.1.1.5'; 

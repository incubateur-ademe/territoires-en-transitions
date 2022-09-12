BEGIN;
-- Suppression tâche 4.1.1.1.1
select private.merge_action_commentaire('cae_4.1.1.1', 'cae_4.1.1.1.1');
select private.remove_action_data('cae_4.1.1.1');
select private.move_action_data('cae_4.1.1.1.1', 'cae_4.1.1.1');
select private.remove_action_data('cae_4.1.1.1.1');


-- Suppression tâche 2.1.1.5
select private.merge_action_commentaire('cae_2.1.1.5', 'cae_2.1.1.5.1');
select private.remove_action_data('cae_2.1.1.5');
select private.move_action_data('cae_2.1.1.5.1', 'cae_2.1.1.5');
select private.remove_action_data('cae_2.1.1.5.1');


-- Suppression tâche 2.3.2.3
select private.merge_action_commentaire('cae_2.3.2.3', 'cae_2.3.2.3.1');
select private.remove_action_data('cae_2.3.2.3');
select private.move_action_data('cae_2.3.2.3.1', 'cae_2.3.2.3');
select private.remove_action_data('cae_2.3.2.3.1');

-- Suppression tâche 5.1.3.1
select private.merge_action_commentaire('cae_5.1.3.1', 'cae_5.1.3.1.1');
select private.remove_action_data('cae_5.1.3.1');
select private.move_action_data('cae_5.1.3.1.1', 'cae_5.1.3.1');
select private.remove_action_data('cae_5.1.3.1.1');

-- Suppression tâche 5.2.2.7
select private.merge_action_commentaire('cae_5.2.2.7', 'cae_5.2.2.7.1');
select private.remove_action_data('cae_5.2.2.7');
select private.move_action_data('cae_5.2.2.7.1', 'cae_5.2.2.7');
select private.remove_action_data('cae_5.2.2.7.1');

-- Suppression tâche 6.1.3.3
select private.merge_action_commentaire('cae_6.1.3.3', 'cae_6.1.3.3.1');
select private.remove_action_data('cae_6.1.3.3');
select private.move_action_data('cae_6.1.3.3.1', 'cae_6.1.3.3');
select private.remove_action_data('cae_6.1.3.3.1');

-- Suppression tâche 6.3.3.2
select private.merge_action_commentaire('cae_6.3.3.2', 'cae_6.3.3.2.1');
select private.remove_action_data('cae_6.3.3.2');
select private.move_action_data('cae_6.3.3.2.1', 'cae_6.3.3.2');
select private.remove_action_data('cae_6.3.3.2.1');

-- Suppression tâche 3.3.2.4
select private.merge_action_commentaire('cae_3.3.2.4', 'cae_3.3.2.4.1');
select private.remove_action_data('cae_3.3.2.4');
select private.move_action_data('cae_3.3.2.4.1', 'cae_3.3.2.4');
select private.remove_action_data('cae_3.3.2.4.1');

COMMIT;

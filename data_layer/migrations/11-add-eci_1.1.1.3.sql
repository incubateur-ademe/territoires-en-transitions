-- Move 1.1.1.4 into 1.1.1.5
update action_commentaire set action_id = 'eci_1.1.1.5' where action_id = 'eci_1.1.1.4'; 
update action_statut set action_id = 'eci_1.1.1.5' where action_id = 'eci_1.1.1.4';

-- Move 1.1.1.3 into 1.1.1.4
update action_commentaire set action_id = 'eci_1.1.1.4' where action_id = 'eci_1.1.1.3'; 
update action_statut set action_id = 'eci_1.1.1.4' where action_id = 'eci_1.1.1.3';

-- Replace 5.1.2.1.5 into 5.1.2.1.6
update action_commentaire set action_id = 'cae_5.1.2.1.6' where action_id = 'cae_5.1.2.1.5'; 
update action_statut set action_id = 'cae_5.1.2.1.6' where action_id = 'cae_5.1.2.1.5'; 

-- Replace 5.1.2.1.4 into 5.1.2.1.5
update action_commentaire set action_id = 'cae_5.1.2.1.5' where action_id = 'cae_5.1.2.1.4'; 
update action_statut set action_id = 'cae_5.1.2.1.5' where action_id = 'cae_5.1.2.1.4'; 

-- Replace 5.1.2.1.3 into 5.1.2.1.4
update action_commentaire set action_id = 'cae_5.1.2.1.4' where action_id = 'cae_5.1.2.1.3'; 
update action_statut set action_id = 'cae_5.1.2.1.4.' where action_id = 'cae_5.1.2.1.3'; 

-- Replace 5.1.2.1.2 into 5.1.2.1.3
update action_commentaire set action_id = 'cae_5.1.2.1.3' where action_id = 'cae_5.1.2.1.2'; 
update action_statut set action_id = 'cae_5.1.2.1.3' where action_id = 'cae_5.1.2.1.2'; 

-- Replace 5.1.2.1.1 into 5.1.2.1.2
update action_commentaire set action_id = 'cae_5.1.2.1.2' where action_id = 'cae_5.1.2.1.1'; 
update action_statut set action_id = 'cae_5.1.2.1.2' where action_id = 'cae_5.1.2.1.1'; 
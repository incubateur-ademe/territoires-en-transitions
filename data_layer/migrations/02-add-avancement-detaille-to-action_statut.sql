
ALTER TYPE avancement ADD VALUE 'detaille'; 
ALTER TABLE action_statut ADD COLUMN avancement_detaille float[]; 

alter table action_statut add constraint avancement_detaille_length CHECK (array_length(avancement_detaille, 1) = 3);
-- alter table action_statut add constraint avancement_detaille_sum_to_1 CHECK (avancement_detaille[0] + avancement_detaille[1] + avancement_detaille[2] = 1);


DROP view business_action_statut; 
 -- create view business_action_statut in 15-action-statut
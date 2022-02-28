alter table action_definition add column if not exists reduction_potentiel text not null default ''; 
alter table action_definition add column if not exists perimetre_evaluation text not null default ''; 

drop function business_upsert_indicateurs; 
drop function business_update_actions; 
drop function referentiel_down_to_action; 
drop function action_down_to_tache; 
drop view action_title; 
drop view action_definition_summary; 

-- Re-execute 14a-referentiel-views.sql
-- Re-execute 22-business_rpc.sql
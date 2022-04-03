create extension if not exists pgtap with schema extensions;

begin;

select plan(2);

select has_table('action_definition'); 
select has_function('business_update_actions'); 

rollback; 
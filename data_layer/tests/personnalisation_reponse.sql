begin;

select plan(13);

select has_table('reponse_choix');
select has_table('reponse_binaire');
select has_table('reponse_proportion');
select has_view('business_reponse');
select has_view('reponse_display');
select has_function('save_reponse');

select has_table('reponse_update_event');
select has_function('after_reponse_insert_write_event');
select has_view('unprocessed_reponse_update_event');

truncate reponse_binaire;
truncate reponse_choix;
truncate reponse_proportion;
truncate reponse_update_event;
truncate personnalisation_consequence;

-- make uid work as if yolododo user was connected.
create or replace function auth.uid() returns uuid as
$$
select '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;

-- insert a reponse like the client would do
do
$$
    declare
        reponse json;
    begin
        reponse = '
        {
          "question_id": "energie_1",
          "collectivite_id": 1,
          "reponse": 0.5
        }
        '::json;
        perform save_reponse(reponse);
    end
$$ language plpgsql;


select results_eq('select reponse from reponse_proportion where collectivite_id = 1 and question_id = ''energie_1'';',
                  'select 0.5::float as reponse',
                  'Reponse proportion value should be present');

select results_eq('select max(created_at) as time from reponse_update_event where collectivite_id = 1',
                  'select modified_at as time '
                      'from reponse_proportion where collectivite_id = 1 and question_id = ''energie_1'';',
                  'An event should be present with the same time as the reponse.');

select results_eq('select created_at as time from unprocessed_reponse_update_event where collectivite_id = 1',
                  'select modified_at as time '
                      'from reponse_proportion where collectivite_id = 1 and question_id = ''energie_1'';',
                  'An unprocessed event should be present with the same time as the reponse.');

-- drop timestamp trigger
drop trigger set_modified_at_before_personnalisation_consequence_update on personnalisation_consequence;

-- insert a consequence like the business would do but set it in the future
insert into personnalisation_consequence (collectivite_id, consequences, modified_at)
values (1, '{}'::jsonb, now() + interval '1 second');

select is_empty('select created_at as time from unprocessed_reponse_update_event where collectivite_id = 1',
                'No event should be present since the consequence have been set after reponse.');

rollback;


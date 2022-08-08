begin;

select plan(3);

select is_empty(
               'select * from retool_user_list',
               'The user list should be empty when querying as postgres.'
           );

select test.identify_as('yolo@dodo.com');
select is_empty(
               'select * from retool_user_list',
               'The user list should be empty when querying as yolo.'
           );

select test.identify_as_service_role();
select isnt_empty(
               'select * from retool_user_list',
               'The user list should not be empty when querying as service role.'
           );

rollback;

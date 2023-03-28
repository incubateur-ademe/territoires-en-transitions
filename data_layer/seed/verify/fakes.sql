-- Fails if there are no users.
select 1/count(*) from auth.users;

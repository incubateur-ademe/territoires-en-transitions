-- Fails if sqitch migration was not executed.
select has_function_privilege('teapot()', 'execute');

select 1 / count(*)
from sqitch.changes
-- should be the latest change.
where change = 'utilisateur/membre';

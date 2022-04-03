-- Fails if auth migration was not ran.
select email_confirmed_at
from auth.users
where false;

-- Fails if storage migration was not ran.
select path_tokens
from storage.objects
where false;

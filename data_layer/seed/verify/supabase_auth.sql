-- Fails if auth migration was not ran.
select email_confirmed_at
from auth.users
where false;


-- Fails if storage migration was not ran.
select path_tokens
from storage.objects
where false;

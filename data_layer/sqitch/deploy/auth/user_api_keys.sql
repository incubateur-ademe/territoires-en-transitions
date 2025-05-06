-- Deploy tet:auth/user_api_keys to pg

BEGIN;


CREATE TABLE if not exists public.user_api_key (
    client_id TEXT PRIMARY KEY NOT NULL,
    user_id  uuid references auth.users on delete cascade,
    client_secret_hash TEXT NOT NULL,
    client_secret_truncated TEXT NOT NULL,
    permissions TEXT[],
    -- TODO when needed: expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
comment on table public.user_api_key is 'Les api keys associées aux utilisateurs.';

create index user_api_key_client_id_index on public.user_api_key(client_id);

create trigger set_modified_at_before_user_api_key_update
    before update
    on
        public.user_api_key
    for each row
execute procedure update_modified_at();

COMMIT;

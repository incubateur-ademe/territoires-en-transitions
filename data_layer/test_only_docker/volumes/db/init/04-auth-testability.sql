-- unsafe, test only
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres;

ALTER ROLE postgres SET search_path TO "auth", "\$user",public,extensions;

ALTER table "auth".users OWNER TO postgres;
ALTER table "auth".refresh_tokens OWNER TO postgres;
ALTER table "auth".audit_log_entries OWNER TO postgres;
ALTER table "auth".instances OWNER TO postgres;
ALTER table "auth".schema_migrations OWNER TO postgres;

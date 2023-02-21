-- Deploy tet:utils/api_key to pg

BEGIN;

-- Token Based API Access for Supabase
--
-- How to configure Supabase (https://supabase.com/) to generate and accept API tokens.
--
-- (c) 2022 Felix Zedén Yverås
-- Provided under the MIT license (https://spdx.org/licenses/MIT.html)
--
-- Disclaimer: This file is formatted using pg_format. I'm not happy with the result but
-- prefer to follow a tool over going by personal taste.
--
-- ---
--
-- # Introduction
--
-- > Supabase is an open source Firebase alternative. Start your project with a Postgres
-- > Database, Authentication, instant APIs, Realtime subscriptions and Storage.
-- > (https://supabase.com/, 2022-08-08)
--
-- Supabase is a new, open source, BaaS (Backend-as-a-Service), providing developers
-- with a simple yet powerful way to power their frontend applications. While not even
-- out of [beta](https://supabase.com/beta), the service already demonstrates the power
-- of PostgreSQL and the open source ecosystem.
--
-- Recently, I have been working on an API service and thought to use Supabase as my
-- backend. The idea is this:
-- 1. "editors" sign in to an administration portal and publish events.
-- 2. "developers" sign in to a developer portal where they can generate API keys to
--    access these events
-- 3. "Developers" can then create third-party applications, websites, etc. using the
--    data they have retrieved from the API.
--
-- To achieve my goals and also prevent abuse, I established the following:
-- 1. API keys should be long-lived and not expire by default,
-- 2. API keys should be immediately revokable,
-- 3. API keys should work as naturally as possible with built-in Supabase functions,
--    such as `auth.uid()`, roles etc.,
-- 4. API access should be logged,
-- 5. it should be possible to limit the rate of requests from a given API key, and
-- 6. old entries in the access log should be purged
--
-- At the time of writing (August 2022), Supabase does not appear to have an out-of-the-box
-- solution for this (see https://github.com/supabase/supabase/issues/7186 and
-- https://github.com/supabase/supabase/discussions/4419). This article/script is
-- therefore designed to document my solution to the problem and to hopefully help you in
-- your own efforts. The article/script is also designed as a migration for the
-- Supabase CLI, meaning there will be some "weird" conditional statements or exception
-- handling in some places to work around running the script multiple times in the fashion
-- Supabase CLI does.
--
-- ## Theory
--
-- At its base, Supabase provides us with a [PostgreSQL](https://www.postgresql.org/)
-- database. This database can be accessed via an API powered by
-- [PostgREST](https://postgrest.org/en/stable/#). This API is in turned hosted behind
-- a [Kong](https://docs.konghq.com/gateway/latest/) API gateway. Supabase also provides
-- a [Gotrue](https://supabase.com/docs/learn/auth-deep-dive/auth-gotrue) auth server
-- which we can thankfully ignore for this article/script. To learn more about Gotrue and
-- Supabase's architecture in general, check out
-- [the official docs](https://supabase.com/docs/guides/hosting/overview#architecture)).
--
-- For now, it's enough to know this:
-- * To get past Kong, we need to set the `apikey` header of our API request to our anon key.
-- * To authenticate with PostgREST, we need to set the `Authorization` header of our API
--   request to `Bearer <our-api-key>`. PostgREST expects `<our-api-key>` to be a valid jwt,
--   meaning our API keys will, by necessity, be jwt tokens.
--
-- Some additional, useful, resources:
-- * https://postgrest.org/en/latest/tutorials/tut1.html#bonus-topic-immediate-revocation
-- * https://github.com/supabase/supabase/issues/3233#issuecomment-1088999663
-- * https://postgrest.org/en/stable/configuration.html#in-database-configuration
--
-- ## Environments
--
-- This script assumes 4 environments:
-- * `local`, a local development environment handled by Supabase CLI
--   (see https://supabase.com/docs/guides/local-development). Extra details in responses
--   are enabled.
-- * `development`, a development environment for testing. Extra details in responses
--   are enabled.
-- * `stage`, a mirror of your production environment for testing. Extra details in
--   responses are NOT enabled.
-- * `production`, your production environment. Extra details in responses are NOT enabled.
--
-- You can set the current environment by running the following query in the SQL Editor:
--
-- ```sql
-- ALTER DATABASE postgres SET config.environment = '<environment>';
-- ```
--
-- If no environment has been configured, `local` is assumed.
--
-- **Before you continue** you should go through this script and update all mentions of
-- these environments to match your setup. You may want to add/remove/edit one or more
-- environments. The script also needs to know e.g. the supabase url and anon key for
-- each environment to work.
--
-- ## Basic Setup
--
-- To start, we will set up an `tokenauthed` role to contrast `authenticated`. This will help
-- us separate users authenticated with API token from users authenticated with email & password.
-- See also https://github.com/supabase/supabase/blob/76e1254a91cd5c6b1eb80d3faf19cfd6a3735a95/docker/volumes/db/init/00-initial-schema.sql
DO $$
    BEGIN
        CREATE ROLE tokenauthed NOLOGIN NOINHERIT;
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '%, skipping', SQLERRM USING ERRCODE = SQLSTATE;
    END
$$;

-- Configure default grants for the tokenauthed role
-- to be similar to those for `authenticated`
GRANT tokenauthed TO authenticator;

ALTER DEFAULT privileges FOR USER supabase_admin IN SCHEMA public GRANT ALL ON tables TO tokenauthed;

ALTER DEFAULT privileges FOR USER supabase_admin IN SCHEMA public GRANT ALL ON functions TO tokenauthed;

ALTER DEFAULT privileges FOR USER supabase_admin IN SCHEMA public GRANT ALL ON sequences TO tokenauthed;

ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON tables TO tokenauthed;

ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON functions TO tokenauthed;

ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON sequences TO tokenauthed;

GRANT USAGE ON SCHEMA public TO tokenauthed;

GRANT ALL ON ALL TABLES IN SCHEMA public TO tokenauthed;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO tokenauthed;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO tokenauthed;

ALTER ROLE tokenauthed SET statement_timeout = '8s';

GRANT USAGE ON SCHEMA extensions TO tokenauthed;

GRANT USAGE ON SCHEMA auth TO tokenauthed;

GRANT USAGE ON SCHEMA storage TO tokenauthed;

ALTER DEFAULT privileges IN SCHEMA storage GRANT ALL ON tables TO tokenauthed;

ALTER DEFAULT privileges IN SCHEMA storage GRANT ALL ON functions TO tokenauthed;

ALTER DEFAULT privileges IN SCHEMA storage GRANT ALL ON sequences TO tokenauthed;

GRANT ALL ON ALL TABLES IN SCHEMA storage TO tokenauthed;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO tokenauthed;

GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO tokenauthed;

-- We will also set up the `api_auth` schema for our tables and functions.
CREATE SCHEMA "api_auth" AUTHORIZATION supabase_admin;

COMMENT ON SCHEMA "api_auth" IS 'API keys and related configuration';

GRANT ALL PRIVILEGES ON SCHEMA api_auth TO supabase_auth_admin;

GRANT USAGE ON SCHEMA api_auth TO anon, authenticated, service_role, tokenauthed;

ALTER DEFAULT privileges IN SCHEMA api_auth GRANT ALL ON tables TO supabase_auth_admin;

ALTER DEFAULT privileges IN SCHEMA api_auth GRANT ALL ON functions TO supabase_auth_admin;

ALTER DEFAULT privileges IN SCHEMA api_auth GRANT ALL ON sequences TO supabase_auth_admin;

-- ## API tokens
--
-- API tokens will be stored in the `tokens` table. Since tokens are authentication
-- credentials, we do not store the tokens themselves, but instead a unique token id.
CREATE TABLE IF NOT EXISTS api_auth.tokens (
                                               id uuid NOT NULL DEFAULT gen_random_uuid (),
                                               user_id uuid NOT NULL,
    -- title, allowing users to name their API tokens if they have multiple.
                                               title text COLLATE pg_catalog."default" NOT NULL,
    -- When a token is revoked, there may yet be log entries relating to it
    -- that need to be kept around a bit longer. The `revoked` column allows
    -- us to mark a token as revoked until such time that we are ready to
    -- delete the row.
                                               revoked boolean NOT NULL DEFAULT FALSE,
                                               created_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
                                               CONSTRAINT tokens_pkey PRIMARY KEY (id))
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS api_auth.tokens OWNER TO supabase_auth_admin;

ALTER TABLE IF EXISTS api_auth.tokens ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE api_auth.tokens IS 'Listing of known API tokens';

-- Since we want to keep token information around until we are sure we do not need
-- it anymore, we'll need to set up a trigger to handle user deletions.
DROP FUNCTION IF EXISTS api_auth.handle_deleted_user CASCADE;

CREATE FUNCTION api_auth.handle_deleted_user ()
    RETURNS TRIGGER
AS $BODY$
BEGIN
    -- Revoke tokens when user accounts are deleted.
    UPDATE
        api_auth.tokens
    SET
        revoked = TRUE
    WHERE
            user_id = OLD.id;
    RETURN NULL;
END;
$BODY$
    LANGUAGE plpgsql
    -- Execute this function with the privileges of
-- its owner to ensure proper access.
    SECURITY DEFINER;

ALTER FUNCTION api_auth.handle_deleted_user () OWNER TO supabase_auth_admin;

CREATE TRIGGER api_auth_handle_deleted_user
    AFTER DELETE ON auth.users
    FOR EACH ROW
EXECUTE FUNCTION api_auth.handle_deleted_user ();

-- To actually create the API tokens we need to mint our own jwt tokens.
-- We will use the `pgjwt` extension for this.
-- (To learn more about the extension, visit its [github](https://github.com/michelp/pgjwt)
-- page.)
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

COMMENT ON EXTENSION "pgjwt" IS 'JSON Web Token API For Postgresql';

-- We'll also use a function to help us with the generation.
-- Some notes:
-- * This function can generate valid JWTs for any user
-- * The token generated by this function is valid forever
-- * We only store the id of the generated token (out of security concerns).
--   The full token will only be provided once, as the return value of this
--   function.
CREATE OR REPLACE FUNCTION api_auth.new_api_token (user_id uuid, title text)
    RETURNS text
AS $token$
DECLARE
    token_id uuid;
    jwt_secret text := coalesce(
        -- Live Supabase instances store the jwt_secret in the `app.settings.jwt_secret` variable.
        -- You can run `SHOW app.settings.jwt_secret;` in the supabase SQL editor for your project
        -- to prove this for yourself.
        -- https://github.com/supabase/supabase-js/issues/25#issuecomment-683239444
        -- https://postgrest.org/en/stable/configuration.html#list-of-parameters
            current_setting('app.settings.jwt_secret', TRUE),
        -- The JWT secret for local development with [Supabase CLI](https://supabase.com/docs/guides/local-development)
        -- has the constant value "super-secret-jwt-token-with-at-least-32-characters-long" as an undocumented "feature".
        -- https://github.com/supabase/supabase-js/issues/25#issuecomment-1019935888
            'super-secret-jwt-token-with-at-least-32-characters-long');
BEGIN
    INSERT INTO api_auth.tokens (
        user_id,
        title)
    VALUES (
               new_api_token.user_id,
               new_api_token.title)
    RETURNING
        id INTO token_id;
    -- Since this is an API token to be given to third parties,
    -- we must be careful with the information we include in the payload.
    -- Learn more:
    -- * https://supabase.com/docs/learn/auth-deep-dive/auth-deep-dive-jwts
    -- * https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims
    -- * https://github.com/supabase/gotrue/blob/master/api/token.go
    -- * https://jwt.io/
    RETURN extensions.sign(json_build_object(
                               -- Id of the token to support immediate revocation
                                   'tid', token_id,
                               -- Issuer
                                   'iss', 'supabase',
                               -- Subject, i.e. the user to whom this token is tied.
                               -- This field is read by `auth.uid()` and must therefore match the user
                               -- who owns the token.
                                   'sub', user_id,
                               -- This field is read by `auth.role()`. It is also used by postgrest to
                               -- determine which role to use when accessing your database.
                               -- Normally, this would be `authenticated`, but we'll use `tokenauthed`
                               -- instead to allow for improved security.
                                   'role', 'tokenauthed',
                               -- Issued At
                                   'iat', extract(epoch FROM now())), jwt_secret::text,
        -- Supabase tokens currently use the HS256 algorithm
        -- https://github.com/supabase/gotrue/blob/f9b28dd076450ba1d24db17e6c68f39f502dab4c/api/token.go#L548
                           'HS256'::text);
END;
$token$
    LANGUAGE plpgsql;

ALTER FUNCTION api_auth.new_api_token(uuid, text) OWNER TO supabase_auth_admin;

-- Allow authenticated (but not `tokenauthed`!) users to create new
-- API tokens for themselves
GRANT EXECUTE ON FUNCTION api_auth.new_api_token(uuid, text) TO authenticated;

-- To help extracting the token id from incoming requests, we'll add the following
-- helper function, based on `auth.uid`.
-- See also
-- https://github.com/supabase/supabase/blob/76e1254a91cd5c6b1eb80d3faf19cfd6a3735a95/docker/volumes/db/init/01-auth-schema.sql
CREATE OR REPLACE FUNCTION api_auth.tid ()
    RETURNS uuid
    LANGUAGE 'sql'
    STABLE
AS $BODY$
SELECT
    coalesce(nullif (current_setting('request.jwt.claim.tid', TRUE), ''), (nullif (current_setting('request.jwt.claims', TRUE), '')::jsonb ->> 'tid'))::uuid
$BODY$;

ALTER FUNCTION "api_auth"."tid"() OWNER TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION api_auth.tid() TO PUBLIC;

-- Helper function to check for token revocation
CREATE OR REPLACE FUNCTION api_auth.check_token_revocation ()
    RETURNS void
    LANGUAGE plpgsql
    -- Execute this function with the privileges of
    -- its owner to ensure proper access rights
    SECURITY DEFINER
AS $BODY$
DECLARE
    revoked boolean;
BEGIN
    revoked = COALESCE((
                           SELECT
                               t.revoked
                           FROM api_auth.tokens t
                           WHERE
                                   id = api_auth.tid ()), TRUE);
    IF revoked THEN
        -- Show extra details in local and development environments
        IF COALESCE(current_setting('config.environment', TRUE), 'local') IN ('development', 'local') THEN
            RAISE sqlstate 'PT401'
                USING MESSAGE = 'Unauthorized', DETAIL = 'Token is invalid or revoked';
        ELSE
            RAISE sqlstate 'PT401'
                USING MESSAGE = 'Unauthorized';
        END IF;
    END IF;
END;
$BODY$;

ALTER FUNCTION api_auth.check_token_revocation () OWNER TO postgres;

GRANT EXECUTE ON FUNCTION api_auth.check_token_revocation () TO postgres;

-- ## Restricting API usage
--
-- To keep our API safe and prevent abuse, we want to be able to limit usage.
-- This could also be useful, e.g. to provide users with "free" and "premium"
-- tiers.
--
-- At this time, it does not appear possible to access the cloudflare edge logs
-- from Supabase (https://github.com/supabase/supabase/discussions/8175).
-- Even if it was, it does not appear possible to access the JWT payload from these
-- logs, making it impossible to attribute usage to individual tokens
-- (https://github.com/supabase/supabase/discussions/6380).
--
-- Instead, we'll have to do our own logging.
CREATE TABLE IF NOT EXISTS api_auth.log (
                                            id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (INCREMENT 1 START 1
                                                MINVALUE 1
                                                MAXVALUE 9223372036854775807
                                                CACHE 1),
                                            user_id uuid NOT NULL DEFAULT auth.uid (),
                                            token_id uuid NOT NULL DEFAULT api_auth.tid (),
                                            method text COLLATE pg_catalog."default" DEFAULT current_setting('request.method'::text, TRUE) ::text,
                                            path text COLLATE pg_catalog."default" DEFAULT current_setting('request.path'::text, TRUE) ::text,
                                            user_agent text COLLATE pg_catalog."default" DEFAULT ((current_setting('request.headers'::text, TRUE))::json ->> 'user-agent'::text),
                                            origin text COLLATE pg_catalog."default" DEFAULT ((current_setting('request.headers'::text, TRUE))::json ->> 'origin'::text),
                                            ip text COLLATE pg_catalog."default" DEFAULT ((current_setting('request.headers'::text, TRUE))::json ->> 'x_real_ip'::text),
                                            created_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
                                            CONSTRAINT log_pkey PRIMARY KEY (id),
                                            CONSTRAINT log_token_id_fkey FOREIGN KEY (token_id) REFERENCES api_auth.tokens (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE RESTRICT)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS api_auth.log OWNER TO supabase_auth_admin;

ALTER TABLE IF EXISTS api_auth.log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE api_auth.log IS 'Log for API token usage';

-- We should also make sure to clean old entires from this log every now and then,
-- say every 30 days.
--
-- Note that there are some issues with cron for the local development CLI:
-- https://github.com/supabase/cli/issues/158. For this reason, we can only
-- perform the following for non-local environments.
CREATE OR REPLACE FUNCTION api_auth.clean_log ()
    RETURNS void
    LANGUAGE plpgsql
AS $BODY$
BEGIN
    DELETE FROM api_auth.log
    WHERE created_at < (now() at time zone 'utc') - interval '30 days';
    DELETE FROM api_auth.tokens
    WHERE tokens.revoked
      AND NOT EXISTS (
            SELECT
                *
            FROM
                api_auth.log
            WHERE
                    log.token_id = tokens.id);
END;
$BODY$;

DO $CONFIGURE_CRON$
    BEGIN
        IF COALESCE(current_setting('config.environment', TRUE), 'local') <> 'local' THEN
            CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
            COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';
            PERFORM
                cron.schedule ('nightly-api-auth-log-clean', '0 1 * * *', $$
        PERFORM
          api_auth.clean_log () $$);
        END IF;
    END
$CONFIGURE_CRON$;

-- Here's the unfortunate part:
-- PostgREST will use a read only transaction for GET requests, and if we want to
-- make use of PostgREST's `db-pre-request` hook, we are also trapped in a read
-- only transaction.
--
-- There is some logic to this - the current host could potentially be a read only
-- replica - but it means we will not be able to make writes to the log table easily.
-- Our workaround will therefore involve making an additional API request to a
-- function which can perform the write.
--
-- Sidenote:
-- If you are only interested in logging write operations (i.e. non-GET requests),
-- you could call `api_auth.validate_token()` (defined further down) manually as part
-- of your RLS policy (instead of via the `db-pre-request` hook) for relevant tables.
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

COMMENT ON EXTENSION "http" IS 'HTTP Client For PostgreSQL, Allows Web Page Retrieval Inside The Database.';

-- Note the `public` schema!
CREATE OR REPLACE FUNCTION public.api_auth_log_request (method text, path text, user_agent text, origin text, ip text)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100 VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
    INSERT INTO api_auth.log(
        method, path, user_agent, origin, ip)
    VALUES (
               api_auth_log_request.method,
               api_auth_log_request.path,
               api_auth_log_request.user_agent,
               api_auth_log_request.origin,
               api_auth_log_request.ip);
END;
$BODY$;

ALTER FUNCTION public.api_auth_log_request(text, text, text, text, text) OWNER TO supabase_auth_admin;

-- Require callers to be authenticated via API token to increase security.
GRANT EXECUTE ON FUNCTION public.api_auth_log_request(text, text, text, text, text) TO tokenauthed;

REVOKE EXECUTE ON FUNCTION public.api_auth_log_request(text, text, text, text, text) FROM public, anon, authenticated;

-- Add OpenAPI description
COMMENT ON FUNCTION public.api_auth_log_request IS $$For internal use only.

For internal use only.

Logs a usage event for the current API token.$$;

-- Helper function to call `public.api_auth_log_request` via the PostgREST API.
CREATE OR REPLACE FUNCTION api_auth.send_log_api_request ()
    RETURNS void
    LANGUAGE plpgsql
    -- Execute this function with the privileges of
    -- its owner to ensure proper access rights
    SECURITY DEFINER
AS $BODY$
DECLARE
    response_status integer;
    response_content text;
    -- TODO: Change these to match your environment!
    supabase_url text := CASE WHEN current_setting('config.environment', TRUE) = 'production' THEN
                                  '<production-url>'
                              WHEN current_setting('config.environment', TRUE) = 'stage' THEN
                                  '<stage-url>'
                              WHEN current_setting('config.environment', TRUE) = 'development' THEN
                                  '<development-url>'
        -- Else: Default for Supabase CLI local development.
        -- Note that Supabase CLI runs supabase locally in a docker environment.
                              ELSE
        -- TODO: Replace with your project id
                                     'http://localhost:8000'
        -- 'http://supabase_kong_<replace_with_(supabase/config.toml#project_id)>:8000'
        END;
    -- NOTE: The anon key is meant to be usable in untrusted contexts.
    -- DO NOT use any other key than your anon key here!
    supabase_anon_key text := CASE WHEN current_setting('config.environment', TRUE) = 'production' THEN
                                       '<production-anon-key>'
                                   WHEN current_setting('config.environment', TRUE) = 'stage' THEN
                                       '<stage-anon-key>'
                                   WHEN current_setting('config.environment', TRUE) = 'development' THEN
                                       '<development-anon-key>'
        -- Else: Default for Supabase CLI local development
                                   ELSE
                                           'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNzIwODU0MCwiZXhwIjoxOTc0MzYzNzQwfQ.zcaQfHd3VA7XgJmdGfmV86OLVJT9s2MTmSy-e69BpUY'
        END;
BEGIN
    SELECT
        status,
        content
    FROM
        -- Post request to enable write access
        http ( --
                ( --
                 'POST', --
                 FORMAT('%s/rest/v1/rpc/api_auth_log_request', supabase_url), --
                 ( --
                     SELECT
                         array_agg(http_header (key, value #>> '{}'))
                     FROM jsonb_each( --
                             jsonb_build_object(
                                 -- Request expects to find its endpoint in the "public" schema.
                                     'Content-Profile', 'public', --
                                     'apikey', supabase_anon_key, --
                             -- Reuse current authorization to maintain security
                             -- on the `api_auth.log` table
                                     'Authorization', current_setting('request.headers')::json ->> 'authorization' --
                                 ))), --
                 'application/json', --
                 jsonb_build_object( --
                         'method', current_setting('request.method'::text, TRUE), --
                         'path', current_setting('request.path'::text, TRUE), --
                         'user_agent', current_setting('request.headers')::json ->> 'user-agent', --
                         'origin', current_setting('request.headers')::json ->> 'origin', --
                         'ip', current_setting('request.headers')::json ->> 'x-real-ip') --
                    )::http_request) INTO response_status,
        response_content;
    IF NOT (coalesce((response_status), -1) BETWEEN 200 AND 299) THEN
        -- Show extra details in local and development environments
        IF COALESCE(current_setting('config.environment', TRUE), 'local') IN ('development', 'local') THEN
            RAISE sqlstate 'PT500'
                USING MESSAGE = 'Failed to log API request', DETAIL = FORMAT('Failed to log API request (%s)', response_status), HINT = response_content;
        ELSE
            RAISE sqlstate 'PT500'
                USING MESSAGE = 'Failed to log API request', DETAIL = FORMAT('Failed to log API request (%s)', response_status);
        END IF;
    END IF;
END;
$BODY$;

ALTER FUNCTION api_auth.send_log_api_request () OWNER TO postgres;

GRANT EXECUTE ON FUNCTION api_auth.send_log_api_request () TO postgres;

-- Back to preventing abuse:
-- First, we want to limit the number of tokens a single user can request.
-- We also want to limit the number of requests a single user(!) can make
-- in a given amount of time.
--
-- The presets here are arbitrary and should be configured to match your
-- use case.
--
-- Note that it is likely reasonable to allow for short request bursts
-- while limiting usage over longer spans of time harder.
CREATE TABLE IF NOT EXISTS api_auth.user_config (
                                                    user_id uuid NOT NULL,
                                                    max_tokens integer NOT NULL DEFAULT 10,
    -- 4 requests/s
                                                    max_req_5s integer NOT NULL DEFAULT 20,
    -- 1.5 request/s
                                                    max_req_10m integer NOT NULL DEFAULT 900,
    -- 0.5 request/s
                                                    max_req_24h integer NOT NULL DEFAULT 43200,
    -- 0.25 request/s
                                                    max_req_7d integer NOT NULL DEFAULT 151200,
    -- 0.2 request/s
                                                    max_req_30d integer NOT NULL DEFAULT 518400,
                                                    updated_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
                                                    created_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
                                                    CONSTRAINT user_config_pkey PRIMARY KEY (user_id),
                                                    CONSTRAINT user_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS api_auth.user_config OWNER TO supabase_auth_admin;

ALTER TABLE IF EXISTS api_auth.user_config ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE api_auth.user_config IS 'API Key restrictions and other API related configuration';

-- We'll set up a trigger to automatically provide our users with a configuration
-- when they sign up (you'll need to add any existing users to the table manually).
CREATE OR REPLACE FUNCTION api_auth.handle_new_user ()
    RETURNS TRIGGER
    LANGUAGE 'plpgsql'
    COST 100 VOLATILE NOT LEAKPROOF
    SECURITY DEFINER
    SET search_path = api
AS $BODY$
BEGIN
    INSERT INTO api_auth.user_config (
        user_id)
    VALUES (
               NEW.id);
    RETURN new;
END;
$BODY$;

ALTER FUNCTION api_auth.handle_new_user () OWNER TO supabase_auth_admin;

CREATE TRIGGER api_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
EXECUTE PROCEDURE api_auth.handle_new_user ();

-- We'll use the moddatetime extension to keep track of configuration changes
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";

COMMENT ON EXTENSION "moddatetime" IS 'Functions For Tracking Last Modification Time';

CREATE TRIGGER api_auth_config_moddatetime
    BEFORE UPDATE ON api_auth.user_config
    FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime ('updated_at');

-- To make supervision easier, we add a helper view.
-- Note that RLS and views are not fully compatible at this time.
-- There appears to be some updates on the horizon in Postgres 15
-- to change this, however.
-- https://www.cybertec-postgresql.com/en/view-permissions-and-row-level-security-in-postgresql/
CREATE OR REPLACE VIEW api_auth.usage AS
SELECT
    coalesce(users.id, log.user_id) AS user_id,
    count(*) FILTER (WHERE log.created_at >= (now() - '00:00:05'::interval)) AS req_5s,
    count(*) FILTER (WHERE log.created_at >= (now() - '00:10:00'::interval)) AS req_10m,
    count(*) FILTER (WHERE log.created_at >= (now() - '24:00:00'::interval)) AS req_24h,
    count(*) FILTER (WHERE log.created_at >= (now() - '7 days'::interval)) AS req_7d,
    count(*) FILTER (WHERE log.created_at >= (now() - '30 days'::interval)) AS req_30d
FROM
    auth.users
        FULL OUTER JOIN api_auth.log ON users.id = log.user_id
GROUP BY
    users.id,
    log.user_id;

ALTER TABLE api_auth.usage OWNER TO supabase_auth_admin;

-- Helper function to validate request limits
CREATE OR REPLACE FUNCTION api_auth.check_usage_limit_rules ()
    RETURNS void
    LANGUAGE plpgsql
    -- Execute this function with the privileges of
    -- its owner to ensure proper access rights
    SECURITY DEFINER
AS $BODY$
DECLARE
    under_usage_limit boolean;
BEGIN
    SELECT
                config.max_req_5s > coalesce(usage.req_5s, 0)
            AND config.max_req_10m > coalesce(usage.req_10m, 0)
            AND config.max_req_24h > coalesce(usage.req_24h, 0)
            AND config.max_req_7d > coalesce(usage.req_7d, 0)
            AND config.max_req_30d > coalesce(usage.req_30d, 0) INTO under_usage_limit
    FROM
        api_auth.user_config config
            LEFT JOIN api_auth.usage usage ON config.user_id = usage.user_id
    WHERE
            config.user_id = auth.uid ();
    IF NOT under_usage_limit THEN
        RAISE sqlstate 'PT429'
            USING MESSAGE = 'Too many requests', DETAIL = 'Account request limit reached', HINT = 'Wait a few minutes and try again.';
    END IF;
END;
$BODY$;

ALTER FUNCTION api_auth.check_usage_limit_rules () OWNER TO postgres;

GRANT EXECUTE ON FUNCTION api_auth.check_usage_limit_rules () TO postgres;

-- For API tokens used on websites, it may be necessary to expose them in code.
-- An example of this is when implementing Google Maps. To keep the tokens
-- (somewhat) secure, we can limit the tokens to be used only by certain websites,
-- using the http
-- [`Origin`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin)
-- header.
--
-- Note that this only prevents attackers from embedding the token in client code
-- on their own websites (since `Origin` is one of the
-- [forbidden header names](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name)).
-- It does not prevent attackers from using the token e.g. with curl or Postman,
-- where the `Origin` header CAN be set.
--
-- Also note that some API testing tools such as [Hoppscotch](https://hoppscotch.io/)
-- may use your browser to send requests under the hood, in which case requests may
-- silently fail to set the `Origin` header.
CREATE TABLE IF NOT EXISTS api_auth.token_origin_rules (
                                                           id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (INCREMENT 1 START 1
                                                               MINVALUE 1
                                                               MAXVALUE 9223372036854775807
                                                               CACHE 1),
                                                           token_id uuid NOT NULL,
                                                           origin text COLLATE pg_catalog."default" NOT NULL,
                                                           CONSTRAINT token_origin_rules_pkey PRIMARY KEY (id),
                                                           CONSTRAINT token_origin_rules_token_id_fkey FOREIGN KEY (token_id) REFERENCES api_auth.tokens (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
                                                           CONSTRAINT token_origin_rules_token_id_origin_uniq UNIQUE (token_id, origin))
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS api_auth.token_origin_rules OWNER TO supabase_auth_admin;

ALTER TABLE IF EXISTS api_auth.token_origin_rules ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE api_auth.token_origin_rules IS 'Whitelist for origins from which an API key may be used. No entries means allowed from all.';

-- Helper function to validate origin whitelist
CREATE OR REPLACE FUNCTION api_auth.check_origin_rules ()
    RETURNS void
    LANGUAGE plpgsql
    -- Execute this function with the privileges of
    -- its owner to ensure proper access rights
    SECURITY DEFINER
AS $BODY$
DECLARE
    valid_origin boolean;
BEGIN
    SELECT
        CASE WHEN NOT EXISTS (
                SELECT
                    *
                FROM
                    api_auth.token_origin_rules
                WHERE
                        token_id = api_auth.tid ())
            OR EXISTS (
                          SELECT
                              *
                          FROM
                              api_auth.token_origin_rules
                          WHERE
                                  token_id = api_auth.tid ()
                            AND origin = (current_setting('request.headers')::json ->> 'origin')) THEN
                 TRUE
             ELSE
                 FALSE
            END INTO valid_origin;
    IF NOT valid_origin THEN
        -- Show extra details in local and development environments
        IF COALESCE(current_setting('config.environment', TRUE), 'local') IN ('development', 'local') THEN
            RAISE sqlstate 'PT403'
                USING MESSAGE = 'Illegal origin', DETAIL = FORMAT('Requests from origin ''%s'' may not use this token', COALESCE(current_setting('request.headers')::json ->> 'origin', ''));
        ELSE
            RAISE sqlstate 'PT403'
                USING MESSAGE = 'Forbidden';
        END IF;
    END IF;
END;
$BODY$;

ALTER FUNCTION api_auth.check_origin_rules () OWNER TO postgres;

GRANT EXECUTE ON FUNCTION api_auth.check_origin_rules () TO postgres;

-- There may also be instances where the caller's IP(s) is known beforehand.
-- In such cases, we can improve security by restricting the token's use to
-- a predefined set of IP addresses.
CREATE TABLE IF NOT EXISTS api_auth.token_ip_rules (
                                                       id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY (INCREMENT 1 START 1
                                                           MINVALUE 1
                                                           MAXVALUE 9223372036854775807
                                                           CACHE 1),
                                                       token_id uuid NOT NULL,
                                                       ip text COLLATE pg_catalog."default" NOT NULL,
                                                       CONSTRAINT token_ip_rules_pkey PRIMARY KEY (id),
                                                       CONSTRAINT token_ip_rules_token_id_fkey FOREIGN KEY (token_id) REFERENCES api_auth.tokens (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
                                                       CONSTRAINT token_ip_rules_token_id_origin_uniq UNIQUE (token_id, ip))
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS api_auth.token_ip_rules OWNER TO supabase_auth_admin;

ALTER TABLE IF EXISTS api_auth.token_ip_rules ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE api_auth.token_ip_rules IS 'Whitelist for IP addresses from which an API key may be used. No entries means allowed from all.';

-- Helper function to validate ip whitelist
CREATE OR REPLACE FUNCTION api_auth.check_ip_rules ()
    RETURNS void
    LANGUAGE plpgsql
    -- Execute this function with the privileges of
    -- its owner to ensure proper access rights
    SECURITY DEFINER
AS $BODY$
DECLARE
    valid_ip boolean;
BEGIN
    SELECT
        CASE WHEN NOT EXISTS (
                SELECT
                    *
                FROM
                    api_auth.token_ip_rules
                WHERE
                        token_id = api_auth.tid ())
            OR EXISTS (
                          SELECT
                              *
                          FROM
                              api_auth.token_ip_rules
                          WHERE
                                  token_id = api_auth.tid ()
                            AND ip = (current_setting('request.headers')::json ->> 'x-real-ip')) THEN
                 TRUE
             ELSE
                 FALSE
            END INTO valid_ip;
    IF NOT valid_ip THEN
        -- Show extra details in local and development environments
        IF COALESCE(current_setting('config.environment', TRUE), 'local') IN ('development', 'local') THEN
            RAISE sqlstate 'PT403'
                USING MESSAGE = 'Illegal IP', DETAIL = FORMAT('Requests from IP ''%s'' may not use this token', COALESCE(current_setting('request.headers')::json ->> 'x-real-ip', ''));
        ELSE
            RAISE sqlstate 'PT403'
                USING MESSAGE = 'Forbidden';
        END IF;
    END IF;
END;
$BODY$;

ALTER FUNCTION api_auth.check_origin_rules () OWNER TO postgres;

GRANT EXECUTE ON FUNCTION api_auth.check_origin_rules () TO postgres;

-- ## Token Validation and Log Writing
--
-- So far, we have successfully created a token which can be used in calls to PostgREST
-- (using the `Authorization` header. Note that the `apikey` header used by Kong still
-- uses your anon key!). We have also created an `api_auth.log` table to keep track of
-- api token usage and set up some restrictions on API token usage.
--
-- Now we need a way to intercept usage of API tokens and perform our validation on them.
-- For such cases, PostgREST exposes the `db-pre-request` hook
-- (https://postgrest.org/en/latest/tutorials/tut1.html#bonus-topic-immediate-revocation).
--
-- NOTE: AFAIK, there can only be _one_ function associated with the `db-pre-request`
-- hook at a time. I have not seen any note of use by Supabase but this may change in
-- the future!
CREATE OR REPLACE FUNCTION api_auth.validate_token ()
    RETURNS void
    LANGUAGE 'plpgsql'
    -- Execute this function with the privileges of
    -- its owner to ensure proper access rights
    SECURITY DEFINER
AS $BODY$
BEGIN
    -- 1. We should only verify api tokens.
    -- Skip check if auth is not done using an API token
    IF auth.role () <> 'tokenauthed' THEN
        RETURN;
    END IF;
    -- 2. Make sure the token has not been revoked
    PERFORM
        api_auth.check_token_revocation ();
    -- 3. We perform logging by making a new API call to `public.api_auth_log_request`.
    -- However, this call will cause `api_auth.validate_token` to be run, potentially
    -- causing an endless loop of requests. Therefore, validation of calls for
    -- `api_auth.validate_token` should be interrupted here.
    IF current_setting('request.path'::text, TRUE)
        LIKE '%/api_auth_log_request' THEN
        RETURN;
    END IF;
    -- 4. Make sure user is under their usage limit
    PERFORM
        api_auth.check_usage_limit_rules ();
    -- 5. Verify request origin
    PERFORM
        api_auth.check_origin_rules ();
    -- 6. Verify request IP
    PERFORM
        api_auth.check_ip_rules ();
    -- 7. Request a write to `api_auth.log`. This is relatively costly as it involves
    -- an network call. We have therefore waited with this request for as long as possible.
    PERFORM
        api_auth.send_log_api_request ();
END
$BODY$;

ALTER FUNCTION api_auth.validate_token () OWNER TO postgres;

GRANT EXECUTE ON FUNCTION api_auth.validate_token () TO postgres;

-- Set `pgrst.db_pre_request` to point to our validation function.
-- This causes PostgREST to execute the function for every valid request,
-- before executing the requested query.
ALTER ROLE postgres SET pgrst.db_pre_request TO 'api_auth.validate_token';

-- ## Configure Access Policies
GRANT ALL ON TABLE api_auth.user_config TO authenticated, tokenauthed;

CREATE POLICY "Allow users to see the API configuration applying to them" ON api_auth.user_config AS PERMISSIVE
    FOR SELECT TO authenticated, tokenauthed
    USING (auth.uid () = user_id);

GRANT ALL ON TABLE api_auth.tokens TO authenticated;

CREATE POLICY "Allow authenticated users to see API token entries they own" ON api_auth.tokens AS PERMISSIVE
    FOR SELECT TO authenticated
    USING (auth.uid () = user_id);

CREATE POLICY "Allow authenticated users to create new API tokens" ON api_auth.tokens AS PERMISSIVE
    FOR INSERT TO authenticated
    WITH CHECK (
            auth.uid () = user_id
        AND (
                -- Prevent users from creating more tokens than their configured maximum
                SELECT (
                           SELECT
                               COUNT(*)
                           FROM
                               api_auth.tokens
                           WHERE
                                   tokens.user_id = user_id AND revoked = FALSE) < (
                           SELECT
                               config.max_tokens
                           FROM
                               api_auth.user_config config
                           WHERE
                                   config.user_id = user_id)));

GRANT ALL ON TABLE api_auth.log TO authenticated, tokenauthed;

CREATE POLICY "Allow authenticated users to see API log entries they own" ON api_auth.log AS PERMISSIVE
    FOR SELECT TO authenticated
    USING (auth.uid () = user_id);

CREATE POLICY "Allow creation of new API log entries" ON api_auth.log AS PERMISSIVE
    FOR INSERT TO tokenauthed
    WITH CHECK (
            auth.uid () = user_id
        AND api_auth.tid () = token_id);

-- Depending on how you use this script, it may be necessary to let PostgREST know
-- about our changes:
NOTIFY pgrst,
    'reload schema';

NOTIFY pgrst,
    'reload config';
COMMIT;

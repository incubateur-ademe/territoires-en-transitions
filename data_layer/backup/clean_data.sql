-- Anonymize sensitive columns after a restore.
-- Run from restore.sh after reset_sequences.sql, before sanity checks.
-- Invoked as: psql -v ON_ERROR_STOP=1 -v pwd="$RESTORE_ENCRYPTED_PASSWORD" -f clean_data.sql
-- The pwd variable may be the empty string; in that case the encrypted_password
-- update and assertion are no-ops, leaving restored values intact (used by local
-- dev when RESTORE_ENCRYPTED_PASSWORD is unset).

-- Stash pwd in a session GUC so the DO-block assertion below can read it via
-- current_setting() — psql does NOT substitute :'pwd' inside $$...$$ bodies.
set app.restore_scrub_pwd = :'pwd';

-- ---- auth.users ----
update auth.users set phone = null where phone is not null;

-- Only when pwd is non-empty.
update auth.users
set encrypted_password = :'pwd'
where :'pwd' <> '' and encrypted_password is distinct from :'pwd';

-- ---- public.dcp ----
-- The auth.users -> dcp trigger uses coalesce(new.phone, telephone), so nulling
-- auth.users.phone does NOT propagate to dcp.telephone. Scrub explicitly.
update public.dcp set telephone = null where telephone is not null;

-- ---- config.service_configurations ----
-- Service-to-service API tokens. Scrubbed so staging/preprod never carry live
-- credentials granting access to the systems those tokens authenticate against.
update config.service_configurations set token = null where token is not null;

-- ---- Post-scrub safety assertion ----
do $$
declare
  pwd text := current_setting('app.restore_scrub_pwd', true);
  bad_phone bigint;
  bad_telephone bigint;
  bad_token bigint;
  bad_pwd bigint;
begin
  select count(*) into bad_phone from auth.users where phone is not null;
  if bad_phone > 0 then
    raise exception 'PII leak: % auth.users rows still have phone IS NOT NULL', bad_phone;
  end if;

  select count(*) into bad_telephone from public.dcp where telephone is not null;
  if bad_telephone > 0 then
    raise exception 'PII leak: % public.dcp rows still have telephone IS NOT NULL', bad_telephone;
  end if;

  select count(*) into bad_token from config.service_configurations where token is not null;
  if bad_token > 0 then
    raise exception 'Credential leak: % config.service_configurations rows still have token IS NOT NULL', bad_token;
  end if;

  if pwd is not null and pwd <> '' then
    select count(*) into bad_pwd from auth.users where encrypted_password is distinct from pwd;
    if bad_pwd > 0 then
      raise exception 'Password scrub failed: % auth.users rows have unexpected encrypted_password', bad_pwd;
    end if;
  end if;
end $$;

reset app.restore_scrub_pwd;

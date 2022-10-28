create table test.auth_users
as
select *
from auth.users;
comment on table test.auth_users is
    'Copie de la table users.';


create function
    test_reset_users()
    returns void
as
$$
-- Supprime les données liées aux utilisateurs qui ne sont pas dans test.auth_users.
delete
from dcp
where user_id not in (select id from test.auth_users);

delete
from private_utilisateur_droit
where user_id not in (select id from test.auth_users);

delete
from auth.users
where id not in (select id from test.auth_users);

-- Restaure la copie.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token,
                        confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change,
                        email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
                        created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token,
                        phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until,
                        reauthentication_token, reauthentication_sent_at)
select id,
       email,
       encrypted_password,
       email_confirmed_at,
       invited_at,
       confirmation_token,
       confirmation_sent_at,
       recovery_token,
       recovery_sent_at,
       email_change_token_new,
       email_change,
       email_change_sent_at,
       last_sign_in_at,
       raw_app_meta_data,
       raw_user_meta_data,
       is_super_admin,
       created_at,
       updated_at,
       phone,
       phone_confirmed_at,
       phone_change,
       phone_change_token,
       phone_change_sent_at,
       email_change_token_current,
       email_change_confirm_status,
       banned_until,
       reauthentication_token,
       reauthentication_sent_at
from test.auth_users
on conflict (id) do update
    set email                       = excluded.email,
        encrypted_password          = excluded.encrypted_password,
        email_confirmed_at          = excluded.email_confirmed_at,
        invited_at                  = excluded.invited_at,
        confirmation_token          = excluded.confirmation_token,
        confirmation_sent_at        = excluded.confirmation_sent_at,
        recovery_token              = excluded.recovery_token,
        recovery_sent_at            = excluded.recovery_sent_at,
        email_change_token_new      = excluded.email_change_token_new,
        email_change                = excluded.email_change,
        email_change_sent_at        = excluded.email_change_sent_at,
        last_sign_in_at             = excluded.last_sign_in_at,
        raw_app_meta_data           = excluded.raw_app_meta_data,
        raw_user_meta_data          = excluded.raw_user_meta_data,
        is_super_admin              = excluded.is_super_admin,
        created_at                  = excluded.created_at,
        updated_at                  = excluded.updated_at,
        phone                       = excluded.phone,
        phone_confirmed_at          = excluded.phone_confirmed_at,
        phone_change                = excluded.phone_change,
        phone_change_token          = excluded.phone_change_token,
        phone_change_sent_at        = excluded.phone_change_sent_at,
        email_change_token_current  = excluded.email_change_token_current,
        email_change_confirm_status = excluded.email_change_confirm_status,
        banned_until                = excluded.banned_until,
        reauthentication_token      = excluded.reauthentication_token,
        reauthentication_sent_at    = excluded.reauthentication_sent_at
;
$$ language sql security definer;
comment on function test_reset_users is
    'Reinitialise les utilisateurs (auth.users) et supprime les données DCP et membres.';

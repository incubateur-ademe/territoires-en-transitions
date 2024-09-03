-- Deploy tet:automatisation/newsletters_pai to pg

BEGIN;

-- Envoie le nouvel utilisateur
create or replace function automatisation.send_user_newsletters_new_pai() returns trigger as $$
declare
    to_send jsonb;
    response bigint;
begin
    if new.panier_id is not null and (old is null or old.panier_id is null) then
        to_send =  to_jsonb((
                            select array_agg(r.*)
                            from (
                                select
                                (
                                select array_agg(u.*)
                                from automatisation.users_crm u
                                join dcp on u.email = dcp.email
                                join auth.users au on dcp.user_id = au.id
                                where dcp.user_id = new.modified_by
                                and au.created_at > now() - interval '1 day'
                                ) as users
                                ) r
                            ));

        select net.http_post(
                       url := sfu.url,
                       body := to_send,
                       headers := jsonb_build_object(
                               'Content-Type', 'application/json',
                               'apikey' , sfu.api_key,
                               'Authorization',  concat('Bearer ',sfu.api_key)
                                  )
               )
        from automatisation.supabase_function_url sfu
        where sfu.nom = 'send_user_pai_to_brevo'
        limit 1 into response;
    end if;
    return new;
exception
    when others then return new;
end;
$$ language plpgsql security definer;

create trigger after_upsert_from_panier_send_user
    after insert or update
    on axe
    for each row
execute procedure automatisation.send_user_newsletters_new_pai();

COMMIT;

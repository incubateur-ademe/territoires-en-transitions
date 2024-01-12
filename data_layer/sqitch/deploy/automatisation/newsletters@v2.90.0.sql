-- Deploy tet:automatisation/newsletters to pg

BEGIN;

create table automatisation.supabase_function_url
(
    nom text primary key,
    api_key text,
    url text not null
);

-- Envoie les utilisateurs qui utilisent les PA
create or replace function automatisation.send_pa_users_newsletters() returns void as $$
declare
    list_new_pa jsonb;
    list_pa_filled jsonb;
    list_pa_empty jsonb;
    to_send jsonb;
    response bigint;
begin
    select jsonb_build_object('list', r.list, 'users', r.users)
    from (
             select  '75' as list, -- Nouveaux utilisateurs PA
                     (
                         select array_agg(distinct crm.*)
                         from (
                                  select dcp.email, min(axe.created_at) as first_date
                                  from dcp
                                           join axe on axe.modified_by = dcp.user_id
                                  where axe.parent is null
                                    and axe.collectivite_id not in (select collectivite_id from collectivite_test)
                                  group by dcp.email
                              ) u
                                  join automatisation.users_crm crm on u.email = crm.email
                         where date(u.first_date) >= date(now() - interval '1 day')
                     ) as users ) r
    into list_new_pa;

    select jsonb_build_object('list', r.list, 'users', r.users)
    from (
             select  '76' as list, -- Utilisateurs PA J+30
                     (
                         select array_agg(distinct crm.*)
                         from
                             (
                                 select plan.id, count(fa) as nb_fiches
                                 from axe plan
                                          left join axe on axe.plan = plan.id
                                          left join fiche_action_axe faa on axe.id = faa.axe_id
                                          left join fiche_action fa on faa.fiche_id = fa.id
                                 where plan.parent is null
                                   and plan.collectivite_id not in (select collectivite_id from collectivite_test)
                                   and (fa.titre is not null or fa.titre != 'Nouvelle fiche')
                                 group by plan.id
                             ) plan
                                 join axe on axe.id = plan.id
                                 join dcp on axe.modified_by = dcp.user_id
                                 join automatisation.users_crm crm on dcp.email = crm.email
                         where date(axe.created_at) = date(now() - interval '30 day')
                           and plan.nb_fiches >=5
                     ) as users ) r
    into list_pa_filled;

    select jsonb_build_object('list', r.list, 'users', r.users)
    from (
             select  '77' as list, --Droppers PA J+30
                     (
                         select array_agg(distinct crm.*)
                         from
                             (
                                 select plan.id, count(faa) as nb_fiches
                                 from axe plan
                                          left join axe on axe.plan = plan.id
                                          left join fiche_action_axe faa on axe.id = faa.axe_id
                                 where plan.parent is null
                                   and plan.collectivite_id not in (select collectivite_id from collectivite_test)
                                 group by plan.id
                             ) plan
                                 join axe on axe.id = plan.id
                                 join dcp on axe.modified_by = dcp.user_id
                                 join automatisation.users_crm crm on dcp.email = crm.email
                         where date(axe.created_at) = date(now() - interval '30 day')
                           and plan.nb_fiches <5
                     ) as users ) r
    into list_pa_empty;

    to_send = jsonb_build_array(list_new_pa, list_pa_empty, list_pa_filled);

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
    where sfu.nom = 'send_users_to_brevo'
    limit 1 into response;
end;
$$ language plpgsql security definer;
comment on function automatisation.send_pa_users_newsletters is
    'Envoie les utilisateurs qui utilisent les PA';

-- Envoie le nouvel utilisateur
create or replace function automatisation.send_insert_users_newsletters() returns trigger as $$
declare
    to_send jsonb;
    response bigint;
begin
    to_send =  to_jsonb((
        select array_agg(r.*)
        from (
                 select '18' as list, -- Liste parcours onboarding
                        (
                            select array_agg(u.*)
                            from automatisation.users_crm u
                            where u.email = new.email
                        ) as users ) r
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
    where sfu.nom = 'send_users_to_brevo'
    limit 1 into response;
    return new;
exception
   when others then return new;
end;
$$ language plpgsql security definer;
comment on function automatisation.send_insert_users_newsletters is
    'Envoie le nouvel utilisateur';


-- Trigger sur la table dcp
create trigger dcp_insert_newsletters
    after insert
    on dcp
    for each row
execute procedure automatisation.send_insert_users_newsletters();

COMMIT;

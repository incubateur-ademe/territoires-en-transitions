-- Revert tet:automatisation/drop_automatisation_schema from pg

BEGIN;

create schema automatisation;

create view automatisation.users_crm as
select p.prenom                              as prenom,
       p.nom                                 as nom,
       p.email                               as email,
       p.telephone                           as telephone,
       u.created_at                          as creation,
       u.last_sign_in_at                     as derniere_connexion
from dcp p
         join auth.users u on u.id = p.user_id;

-- La table est recréée vide : url et api_key de send_users_to_brevo sont
-- propres à chaque environnement et n'ont jamais été versionnées ici.
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

create or replace function automatisation.send_admin_edl_complete() returns void
    security definer
    language plpgsql
as $$
declare
    new_scores client_scores[];
    new_score client_scores;
    complete boolean;
    to_send jsonb;
    response bigint;
begin
    select array_agg(cs.*)
    from client_scores cs
    where date(cs.modified_at) >= date(now() - interval '1 day')
    into new_scores;

    foreach new_score in array new_scores
        loop
            with
                score AS (
                    SELECT new_score.collectivite_id, new_score.referentiel,
                           jsonb_array_elements(new_score.scores) AS o
                ),
                completude AS (
                    SELECT score.collectivite_id, score.referentiel,
                           (score.o ->> 'completed_taches_count'::text)::integer   AS nb,
                           (score.o ->> 'total_taches_count'::text)::integer       AS total
                    FROM score
                    WHERE case when score.referentiel = 'eci'then
                                   score.o @> '{"action_id": "eci"}'::jsonb
                               else
                                   score.o @> '{"action_id": "cae"}'::jsonb
                              end
                )
            select
                -- Regarde si le nouveau score indique que l'état des lieux est complété
                (c.nb = c.total) and
                -- Regarde si l'ancien score indique que le référentiel n'était pas complété
                (case when c.referentiel='eci'then pc.completude_eci<100 else pc.completude_cae<100 end) as complete
            from completude c
                     left join stats.pourcentage_completude pc on c.collectivite_id = pc.collectivite_id
            into complete;

            if complete then
                to_send =  to_jsonb((
                    select array_agg(r.*)
                    from (
                             select '83' as list, -- Liste EDL terminé
                                    (
                                        select array_agg(crm.*)
                                        from private_utilisateur_droit pud
                                                 join dcp on pud.user_id = dcp.user_id
                                                 join automatisation.users_crm crm on dcp.email = crm.email
                                        where pud.active
                                          and pud.niveau_acces = 'admin'
                                          and pud.collectivite_id = new_score.collectivite_id

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
            end if;
        end loop;

end;
$$;

create or replace function automatisation.send_upsert_collectivites_json_n8n(duree interval) returns void as $$
declare
    to_send jsonb;
    uri text;
begin
    to_send = to_jsonb((select to_jsonb(array_agg(c.*))
                        from automatisation.collectivites_crm c
                        where c.date_dernier_score>now()-duree));
    uri = (select au.uri from automatisation.automatisation_uri au where au.uri_type = 'collectivite_upsert' limit 1);
    if uri is not null then
        perform net.http_post(
                uri::varchar,
                to_send
            );
    end if;
end;
$$ language plpgsql security definer;
comment on function automatisation.send_upsert_collectivites_json_n8n is
    'Envoie le json de l''enregistrement collectivite upsert à n8n';

create or replace function automatisation.verification_scores(out status integer)
    returns integer
    language sql
    security definer
    set search_path to 'public', 'extensions'
as $$
with configuration as (select
                        CONCAT(service_url,'/api/v1/referentiels/all/check-last-scores?notification=true') as verification_url,
                        jsonb_build_object(
                            'Authorization', CONCAT('Bearer ', token)
                        ) as verification_headers
                       from config.service_configurations
                       where service_key = 'backend'
                       order by created_at desc
                       limit 1)
select post.*
from configuration -- si il n'y a aucune configuration on ne fait pas d'appel
         left join lateral (select *
                            from net.http_get(
                                    configuration.verification_url,
                                    '{}'::jsonb,
                                    configuration.verification_headers
                                )
    ) as post on true
$$;
comment on function automatisation.verification_scores is
    'Appel la fonction de verification des scores pour tester le nouveau moteur de calcul';

select cron.schedule('send_pa_users_to_brevo',
                     '0 0 * * *', -- every day
                     $$select automatisation.send_pa_users_newsletters();$$);

COMMIT;

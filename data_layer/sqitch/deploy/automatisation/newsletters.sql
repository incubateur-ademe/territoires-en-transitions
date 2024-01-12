-- Deploy tet:automatisation/newsletters to pg

BEGIN;

-- Envoie l'administrateur de la collectivité dont l'état des lieux vient d'être complété
create or replace function automatisation.send_admin_edl_complete() returns trigger as $$
declare
    complete boolean;
    to_send jsonb;
    response bigint;
begin
    -- Regarde si le nouveau score indique que l'état des lieux est complété
    with
        score AS (
            SELECT new.collectivite_id,
                   jsonb_array_elements(new.scores) AS o
        ),
        completude AS (
            SELECT score.collectivite_id,
                   (score.o ->> 'completed_taches_count'::text)::integer   AS nb,
                   (score.o ->> 'total_taches_count'::text)::integer       AS total
            FROM score
            WHERE case when new.referentiel = 'eci'then
                           score.o @> '{"action_id": "eci"}'::jsonb
                       else
                           score.o @> '{"action_id": "cae"}'::jsonb
                      end
        )
    select c.nb = c.total as complete
    from completude c
    into complete;

    if complete then
        if old is not null then
            -- Regarde si l'ancien score indique que le référentiel n'était pas complété
            with
                score AS (
                    SELECT old.collectivite_id,
                           jsonb_array_elements(old.scores) AS o
                ),
                completude AS (
                    SELECT score.collectivite_id,
                           (score.o ->> 'completed_taches_count'::text)::integer   AS nb,
                           (score.o ->> 'total_taches_count'::text)::integer       AS total
                    FROM score
                    WHERE case when old.referentiel = 'eci'then
                                   score.o @> '{"action_id": "eci"}'::jsonb
                               else
                                   score.o @> '{"action_id": "cae"}'::jsonb
                              end
                )
            select c.nb < c.total as complete
            from completude c
            into complete;
        end if;
    end if;

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
                                  and pud.collectivite_id = new.collectivite_id

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
    return new;
exception
    when others then return new;
end;
$$ language plpgsql security definer;
comment on function automatisation.send_admin_edl_complete is
    'Envoie l''administrateur de la collectivité dont l''état des lieux vient d''être complété';


-- Trigger sur la table dcp
create trigger client_score_edl_complete
    before insert or update
    on client_scores
    for each row
execute procedure automatisation.send_admin_edl_complete();

COMMIT;

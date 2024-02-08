-- Deploy tet:automatisation/newsletters to pg

BEGIN;

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

create or replace function stats.refresh_views() returns void
    security definer
    language plpgsql
as
$$
begin
    -- La fonction ci-dessous doit utiliser la vue stats.pourcentage_completude avant son refresh.
    perform automatisation.send_admin_edl_complete();
    refresh materialized view stats.collectivite;
    refresh materialized view stats.collectivite_utilisateur;
    refresh materialized view stats.collectivite_referentiel;
    refresh materialized view stats.collectivite_labellisation;
    refresh materialized view stats.collectivite_plan_action;
    refresh materialized view stats.collectivite_action_statut;
    refresh materialized view stats.evolution_activation;
    refresh materialized view stats.rattachement;
    refresh materialized view stats.utilisateur;
    refresh materialized view stats.evolution_utilisateur;
    refresh materialized view stats.connection;
    refresh materialized view stats.evolution_connection;
    refresh materialized view stats.carte_collectivite_active;
    refresh materialized view stats.evolution_total_activation_par_type;
    refresh materialized view stats.collectivite_actives_et_total_par_type;
    refresh materialized view stats.evolution_nombre_utilisateur_par_collectivite;
    refresh materialized view stats.carte_epci_par_departement;
    refresh materialized view stats.pourcentage_completude;
    refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
    refresh materialized view stats.evolution_indicateur_referentiel;
    refresh materialized view stats.evolution_resultat_indicateur_referentiel;
    refresh materialized view stats.evolution_resultat_indicateur_personnalise;
    refresh materialized view stats.engagement_collectivite;
    refresh materialized view stats.evolution_nombre_fiches;
end ;
$$;

COMMIT;

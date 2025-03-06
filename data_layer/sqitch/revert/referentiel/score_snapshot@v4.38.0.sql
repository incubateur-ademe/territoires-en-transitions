-- Deploy tet:referentiel/score_snapshot to pg

BEGIN;

-- Recrée la fonction supprimée

CREATE OR REPLACE FUNCTION public.action_preuve(id action_id, OUT id action_id, OUT preuve text)
 RETURNS record
 LANGUAGE sql
 STABLE
AS $function$
select action_definition.action_id, action_definition.preuve
from action_definition
where action_definition.action_id = action_preuve.id
  and est_verifie()
$function$
;

-- Recrée la function initiale
create or replace function automatisation.save_score_snapshot(
	collectivite_id integer,
	referentiel referentiel,
	jalon varchar,
	audit_id integer,
    out status integer
)
as
$$
with configuration as (select
                        CONCAT(service_url,'/api/v1/collectivites/',collectivite_id::text,'/referentiels/', referentiel, '/scores?mode=depuis_sauvegarde&snapshot=true&snapshotForceUpdate=true&jalon=', jalon, '&auditId=', audit_id) as full_url,
                        jsonb_build_object(
                            'Authorization', CONCAT('Bearer ', token)
                        ) as headers
                       from config.service_configurations as config
                       where service_key = 'backend'
                       order by config.created_at desc
                       limit 1)
select post.*
from configuration -- si il n'y a aucune configuration on ne fait pas d'appel
         left join lateral (select *
                            from net.http_get(
                                    configuration.full_url,
                                    '{}'::jsonb,
                                    configuration.headers
                                )
    ) as post on true
$$
    language sql
    security definer
    -- permet au trigger d'utiliser l'extension http.
    set search_path = public, extensions;
comment on function automatisation.save_score_snapshot
    is 'Sauvegarde des scores dans la table score_snapshot';


-- Recrée l'ancien trigger sur la table `client_scores`

CREATE OR REPLACE FUNCTION public.after_client_scores_save_snapshot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    perform automatisation.save_score_snapshot(new.collectivite_id, new.referentiel, 'score_courant', 0);
    return new;
exception -- si l'appel lève une erreur on continue.
    when others then return new;
end
$function$
;

create trigger after_save_snapshot
    after insert or update
    on client_scores
    for each row
execute procedure after_client_scores_save_snapshot();


-- Recrée l'ancien trigger sur la table `post_audit_scores`

CREATE OR REPLACE FUNCTION public.after_post_audit_scores_save_snapshot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    perform automatisation.save_score_snapshot(new.collectivite_id, new.referentiel, 'post_audit', new.audit_id);
    return new;
exception -- si l'appel lève une erreur on continue.
    when others then return new;
end
$function$
;

create trigger after_save_snapshot
    after insert or update
    on post_audit_scores
    for each row
execute procedure after_post_audit_scores_save_snapshot();


-- Recrée l'ancien trigger sur la table `pre_audit_scores`

CREATE OR REPLACE FUNCTION public.after_pre_audit_scores_save_snapshot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    perform automatisation.save_score_snapshot(new.collectivite_id, new.referentiel, 'pre_audit', new.audit_id);
    return new;
exception -- si l'appel lève une erreur on continue.
    when others then return new;
end
$function$
;

create trigger after_save_snapshot
    after insert or update
    on pre_audit_scores
    for each row
execute procedure after_pre_audit_scores_save_snapshot();

COMMIT;

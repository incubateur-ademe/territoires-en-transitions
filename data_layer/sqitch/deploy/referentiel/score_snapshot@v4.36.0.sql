-- Deploy tet:referentiel/score_snapshot to pg

BEGIN;

CREATE TABLE IF NOT EXISTS "score_snapshot" (
	"collectivite_id" integer NOT NULL,
	"referentiel_id" varchar(30) NOT NULL,
	"referentiel_version" varchar(16) NOT NULL,
	"audit_id" integer,
	"date" timestamp with time zone NOT NULL,
	"ref" varchar(30) NOT NULL,
	"nom" varchar(300) NOT NULL,
	"type_jalon" varchar(30) NOT NULL,
	"point_fait" double precision NOT NULL,
	"point_programme" double precision NOT NULL,
	"point_pas_fait" double precision NOT NULL,
	"point_potentiel" double precision NOT NULL,
	"referentiel_scores" jsonb NOT NULL,
	"personnalisation_reponses" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone  DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"modified_by" uuid,
	"modified_at" timestamp with time zone  DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "score_snapshot_collectivite_id_referentiel_id_ref_pkey" PRIMARY KEY("collectivite_id","referentiel_id", "ref"),
	CONSTRAINT "score_snapshot_collectivite_id_referentiel_id_type_jalon_date_unique" UNIQUE("collectivite_id","referentiel_id","type_jalon","date")
);
comment on table score_snapshot is
    'Sauvegarde des scores des collectivités déclenchées automatiquement ou manuellement';

CREATE UNIQUE INDEX score_snapshot_collectivite_id_referentiel_id_score_courant ON score_snapshot (collectivite_id, referentiel_id ) WHERE type_jalon = 'score_courant';

alter table score_snapshot enable row level security;
drop policy if exists allow_read on score_snapshot;
create policy allow_read on score_snapshot for select using(is_authenticated());

ALTER TABLE "score_snapshot" ADD CONSTRAINT "score_snapshot_collectivite_id_fkey" FOREIGN KEY ("collectivite_id") REFERENCES "public"."collectivite"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "score_snapshot" ADD CONSTRAINT "score_snapshot_referentiel_id_fkey" FOREIGN KEY ("referentiel_id") REFERENCES "public"."referentiel_definition"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "score_snapshot" ADD CONSTRAINT "score_snapshot_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "labellisation"."audit"("id") ON DELETE cascade ON UPDATE no action;

create trigger modified_at
    before insert or update
    on score_snapshot
    for each row
execute procedure update_modified_at();

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

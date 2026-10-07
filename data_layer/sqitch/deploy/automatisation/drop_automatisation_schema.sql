-- Deploy tet:automatisation/drop_automatisation_schema to pg
-- requires: automatisation_schema
-- requires: automatisation/newsletters
-- requires: cron/send_pa_users_to_brevo
-- requires: referentiel/verification_score

BEGIN;

-- L'alimentation des listes Brevo (18, 75, 76, 77, 83) passe hors plateforme,
-- côté data : plus rien n'appelle l'edge function send_users_to_brevo.
select cron.unschedule(jobid) from cron.job where jobname = 'send_pa_users_to_brevo';

drop trigger dcp_insert_newsletters on dcp;

drop function automatisation.send_insert_users_newsletters();
drop function automatisation.send_pa_users_newsletters();
-- Plus appelée depuis stats/drop-old-stats-views, qui a réécrit stats.refresh_views().
drop function automatisation.send_admin_edl_complete();

drop table automatisation.supabase_function_url;

-- Plus aucun appelant une fois les fonctions ci-dessus retirées.
drop view automatisation.users_crm;

-- Sans appelant : l'une lit des objets du CRM n8n déjà supprimés, l'autre a
-- perdu son cron dans cron/delete_score_cron.
drop function automatisation.send_upsert_collectivites_json_n8n(interval);
drop function automatisation.verification_scores();

-- Sans cascade : échoue si un objet non versionné subsiste dans le schéma.
drop schema automatisation;

COMMIT;

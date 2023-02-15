-- Revert tet:utils/automatisation from pg

BEGIN;

drop trigger dcp_insert_automatisation on dcp;
drop trigger dcp_upsert_automatisation on dcp;
drop trigger utilisateur_droit_upsert_automatisation on private_utilisateur_droit;
drop trigger collectivite_membre_upsert_automatisation on private_collectivite_membre;
drop function automatisation.send_insert_users_json_n8n();
drop function automatisation.send_upsert_users_json_n8n();
drop function automatisation.send_upsert_collectivites_json_n8n(interval);
drop function automatisation.send_upsert_collectivite_membre_json_n8n();
drop view automatisation.users_crm;
drop view automatisation.collectivites_crm;
drop view automatisation.collectivite_membre_crm;
drop table automatisation.automatisation_uri;
drop type automatisation.automatisation_type;

COMMIT;

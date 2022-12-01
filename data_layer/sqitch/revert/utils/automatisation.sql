-- Revert tet:utils/automatisation from pg

BEGIN;

drop trigger dcp_upsert_automatisation on dcp;
drop trigger commune_upsert_automatisation on commune;
drop trigger epci_upsert_automatisation on epci;
drop trigger collectivite_membre_upsert_automatisation on private_collectivite_membre;
drop function send_collectivites_json_n8n();
drop function send_users_json_n8n();
drop function send_collectivite_membre_json_n8n();
drop view users_crm;
drop view collectivites_crm;
drop view collectivite_membre_crm;
drop table automatisation_uri;
drop type automatisation_type;

COMMIT;

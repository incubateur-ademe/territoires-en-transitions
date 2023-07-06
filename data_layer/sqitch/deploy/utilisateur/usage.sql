-- Deploy tet:utilisateur/usage to pg

BEGIN;

alter type usage_fonction add value if not exists 'cta_plan_creation';
alter type usage_fonction add value if not exists 'cta_plan_maj';
alter type usage_fonction add value if not exists 'cta_edl_commencer';
alter type usage_fonction add value if not exists 'cta_edl_personnaliser';
alter type usage_action add value if not exists 'agrandissement';

COMMIT;

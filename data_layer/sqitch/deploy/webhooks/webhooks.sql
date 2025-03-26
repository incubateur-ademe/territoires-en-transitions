-- Deploy tet:webkooks/webhooks to pg

BEGIN;

create schema if not exists webhooks;
grant usage on schema webhooks to postgres, service_role;
comment on schema webhooks is
    'Regroupe les tables liées aux webhooks: configurations et messages';

CREATE TABLE if not exists webhooks.webhook_configuration (
    ref TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    url TEXT NOT NULL,
    authentication_method TEXT NOT NULL,
    payload_format TEXT NOT NULL DEFAULT 'default',
    secret_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
comment on table webhooks.webhook_configuration is
    'Table de configuration des webhooks. Chaque ligne représente une configuration (url, authentification, etc.) pour un type d''événement spécifique.';

CREATE TABLE if not exists  webhooks.webhook_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_ref TEXT NOT NULL REFERENCES webhooks.webhook_configuration(ref) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  sent_payload JSONB,
  response JSONB,
  entity_id TEXT NOT NULL,
  entity_external_id TEXT,
  status TEXT NOT NULL,
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
comment on table webhooks.webhook_message is
    'Table listant les messages envoyés aux webhooks. Chaque ligne représente un message envoyé, avec des informations sur le statut, les erreurs éventuelles, etc.';

COMMIT;

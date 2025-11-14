-- Deploy tet:notifications/notification to pg

BEGIN;

create schema if not exists notifications;
grant usage on schema notifications to postgres, service_role;
comment on schema notifications is
  'Regroupe les tables liées aux notifications';

create table notifications.notification
(
  id            serial primary key,
  entity_id     text,
  status        text check (status in ('pending', 'sent', 'failed')) not null default 'pending',
  send_to       uuid references auth.users not null,
  sent_at       timestamp with time zone,
  sent_to_email text,
  error_message text,
  retries       integer not null default 0,
  created_by    uuid,
  created_at    timestamp with time zone default CURRENT_TIMESTAMP not null,
  notified_on text check (notified_on in ('update_fiche_pilote')) not null,
  notification_data jsonb not null
);
comment on table notifications.notification is
  'Table listant les notifications à envoyer ou déjà envoyées';

comment on column notifications.notification.entity_id is
  'ID de l''entité liée à la notification (par exemple le ficheId pour une notification "update_fiche_pilote")';

alter table notifications.notification enable row level security;

COMMIT;

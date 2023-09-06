-- Deploy tet:site/contact to pg

BEGIN;

create table site_contact
(
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    email       text                                               not null,
    formulaire  jsonb                                              not null
);

select private.add_modified_at_trigger('public', 'site_contact');

alter table site_contact
    enable row level security;

COMMIT;

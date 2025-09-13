-- Deploy tet:indicateur/add-modified-fields-to-indicateur-collectivite to pg

BEGIN;

alter table indicateur_collectivite
    add column modified_by uuid references auth.users default auth.uid();

alter table indicateur_collectivite
    add column modified_at timestamp with time zone default CURRENT_TIMESTAMP not null;

-- Initialise fields to values coming from indicateur_definition table
update indicateur_collectivite
set modified_by = indicateur_definition.modified_by,
    modified_at = indicateur_definition.modified_at
from indicateur_definition
where indicateur_collectivite.indicateur_id = indicateur_definition.id;

COMMIT;

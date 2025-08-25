-- Deploy tet:collectivite/collectivite_relations to pg

BEGIN;

-- Create collectivite_relations table to store hierarchical relationships between collectivites
create table collectivite_relations
(
    id          integer references collectivite(id) on delete cascade,
    parent_id   integer references collectivite(id) on delete cascade,
    primary key (id, parent_id)
);

comment on table collectivite_relations is 'Relations hiérarchiques entre collectivités (EPCI Fiscalité propre -> communes, Syndicats -> EPCI Fiscalité propre)';

-- Enable RLS to protect from public access
alter table collectivite_relations
    enable row level security;


COMMIT;

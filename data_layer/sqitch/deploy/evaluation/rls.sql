-- Deploy tet:evaluation/rls to pg
-- requires: evaluation/consequence

BEGIN;

alter table client_scores enable row level security;
create policy allow_read
    on client_scores
    using (true);

alter table personnalisation_consequence enable row level security;
create policy allow_read
    on personnalisation_consequence
    using (true);

COMMIT;

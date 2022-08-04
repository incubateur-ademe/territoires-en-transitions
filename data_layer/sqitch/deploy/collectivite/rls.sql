-- Deploy tet:collectivite/rls to pg
-- requires: collectivite/toutes_les_collectivites

BEGIN;

alter table filtre_intervalle enable row level security;
drop policy if exists allow_read on filtre_intervalle;
create policy allow_read
    on filtre_intervalle
    using (true);

COMMIT;

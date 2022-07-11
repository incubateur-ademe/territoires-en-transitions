-- Deploy tet:labellisation/labellisation to pg
-- requires: referentiel/contenu
-- requires: collectivite/collectivite
-- requires: utils/auth

BEGIN;

create table if not exists labellisation
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    referentiel     referentiel not null,
    obtenue_le      timestamp   not null,
    annee           float generated always as (date_part('year', obtenue_le)) stored,
    etoiles         integer     not null,
    score_realise   float,
    score_programme float,
    unique (collectivite_id, annee)
);

alter table labellisation
    enable row level security;

create policy allow_read
    on labellisation
    for select
    using (is_authenticated());

COMMIT;

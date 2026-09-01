-- Deploy tet:referentiel/banatic_2025_perimetre to pg
-- requires: referentiel/banatic_2025

BEGIN;

-- Nombre de communes distinctes dont la compétence
-- est transférée via l'EPCI vers un groupement intermédiaire (fichier transfert Banatic).
alter table collectivite_banatic_2025_transfert
    add column nb_communes_transferees integer;

-- Périmètre de l'EPCI : nombre de communes membres.
create table collectivite_banatic_2025_perimetre
(
    collectivite_id     integer primary key references collectivite (id) on delete cascade,
    nb_communes_membres integer     not null check (nb_communes_membres >= 0),
    created_at          timestamptz not null default now()
);

alter table collectivite_banatic_2025_perimetre
    enable row level security;
create policy allow_read_for_all on collectivite_banatic_2025_perimetre using (true);

COMMIT;

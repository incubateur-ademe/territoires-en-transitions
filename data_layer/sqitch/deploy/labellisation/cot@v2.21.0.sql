-- Deploy tet:labellisation/cot to pg

BEGIN;

create table cot
(
    collectivite_id integer references collectivite primary key,
    actif           bool not null
);
comment on table cot is
    'Le Contrat d''objectifs territorial rattaché à une collectivité.';
comment on column cot.actif is
    'Vrai si un Contrat d''objectif existe. '
        'A pour conséquence la modification des possibilités d''audit.';

alter table cot
    enable row level security;
create policy allow_read_for_all
    on cot
    for select using (true);

COMMIT;

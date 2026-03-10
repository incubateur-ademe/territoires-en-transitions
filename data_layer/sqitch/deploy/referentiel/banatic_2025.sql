-- Deploy tet:referentiel/banatic_2025 to pg

BEGIN;

-- Référentiel des compétences Banatic 2025 (codes numériques 4 chiffres)
create table banatic_2025_competence
(
    competence_code integer primary key,
    intitule        text not null,
    version	        varchar(16) DEFAULT '1.0.0'::character varying NOT NULL,
    constraint banatic_2025_competence_code_format check (competence_code >= 1000 and competence_code <= 9999)
);

alter table banatic_2025_competence
    enable row level security;
create policy allow_read_for_all on banatic_2025_competence using (true);

-- Mapping Banatic 2021 (integer) -> Banatic 2025 (integer 4 chiffres). Explicite : no_equivalent a code_2025 null.
create table banatic_2021_2025_crosswalk
(
    id           bigserial primary key,
    code_2021    integer not null references banatic_competence (code) on delete cascade,
    code_2025    integer references banatic_2025_competence (competence_code) on delete cascade,
    mapping_type text not null check (mapping_type in ('one_to_one', 'split', 'no_equivalent')),
    unique (code_2021, code_2025)
);

-- Au plus une ligne no_equivalent par code_2021 (code_2025 null).
create unique index banatic_2021_2025_crosswalk_one_no_equivalent
    on banatic_2021_2025_crosswalk (code_2021)
    where code_2025 is null;

create index banatic_2021_2025_crosswalk_code_2025 on banatic_2021_2025_crosswalk (code_2025);
create index banatic_2021_2025_crosswalk_code_2021 on banatic_2021_2025_crosswalk (code_2021);

alter table banatic_2021_2025_crosswalk
    enable row level security;
create policy allow_read_for_all on banatic_2021_2025_crosswalk using (true);

-- Compétences 2025 par collectivité (exercice = true si la collectivité exerce la compétence)
create table collectivite_banatic_2025_competence
(
    collectivite_id integer not null references collectivite (id) on delete cascade,
    competence_code  integer not null references banatic_2025_competence (competence_code),
    exercice         boolean not null default true,
    created_at       timestamptz not null default now(),
    primary key (collectivite_id, competence_code)
);

create index collectivite_banatic_2025_competence_competence_code
    on collectivite_banatic_2025_competence (competence_code);

alter table collectivite_banatic_2025_competence
    enable row level security;
create policy allow_read_for_all on collectivite_banatic_2025_competence using (true);

-- Transferts de compétences banatic 2025
create table collectivite_banatic_2025_transfert
(
    collectivite_id  integer not null references collectivite (id) on delete cascade,
    competence_code  integer not null references banatic_2025_competence (competence_code),
    nature_transfert text,
    created_at       timestamptz not null default now(),
    primary key (collectivite_id, competence_code)
);

alter table collectivite_banatic_2025_transfert
    enable row level security;
create policy allow_read_for_all on collectivite_banatic_2025_transfert using (true);

COMMIT;

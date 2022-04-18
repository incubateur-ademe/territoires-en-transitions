create schema if not exists raw;

create type nature as enum ('SMF', 'CU', 'CC', 'SIVOM', 'POLEM', 'METRO', 'SMO', 'CA', 'EPT', 'SIVU', 'PETR');
create domain codegeo as varchar(5);
create domain siren as varchar(9)
    check (
        value ~ '^\d{9}$'
        );

create schema if not exists imports;
create table imports.region
(
    code       varchar(2) primary key,
    population int4        not null,
    libelle    varchar(30) not null,
    drom       bool        not null
);

create table imports.departement
(
    code        varchar(3) primary key,
    region_code varchar(2)  not null references imports.region,
    population  int4        not null,
    libelle     varchar(30) not null
);

create table imports.commune
(
    code             codegeo primary key,
    region_code      varchar(2)  not null references imports.region,
    departement_code varchar(3)  not null references imports.departement,
    libelle          varchar(30) not null,
    population       int4        not null
);


create table imports.banatic
(
    siren            siren primary key,
    libelle          varchar(250) not null,
    region_code      varchar(2)   not null references imports.region,
    departement_code varchar(3)   not null references imports.departement,
    nature           nature       not null,
    population       int4         not null
);


create schema if not exists raw;

create table raw.population2019
(
    REG  varchar(2),
    DEP  varchar(3),
    COM  codegeo,
    PMUN integer,
    PCAP integer,
    PTOT integer
);

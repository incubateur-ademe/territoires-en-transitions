-- Deploy tet:indicateur/artificialisation to pg

BEGIN;

create table indicateur_artificialisation
(
    collectivite_id integer references collectivite primary key,
    total           integer not null,
    activite        integer not null,
    habitat         integer not null,
    mixte           integer not null,
    routiere        integer not null,
    ferroviaire     integer not null,
    inconnue        integer not null
);
alter table indicateur_artificialisation
    enable row level security;
create policy allow_read on indicateur_artificialisation for select using (true);

create function
    indicateur_artificialisation(site_labellisation)
    returns setof indicateur_artificialisation
    rows 1
    security definer
begin
    atomic
    select ia
    from indicateur_artificialisation ia
    where ia.collectivite_id = $1.collectivite_id;
end;
comment on function indicateur_artificialisation(site_labellisation) is
    'Flux de consommation d’espaces, par destination entre 2009 et 2022';

COMMIT;

-- Deploy tet:indicateur/source to pg

BEGIN;

create table indicateur_source
(
    id      text primary key,
    libelle text not null
);

insert into indicateur_source (id, libelle)
values ('citepa', 'CITEPA'),
       ('orcae', 'ORCAE'),
       ('cerema', 'Cerema'),
       ('terristory', 'TerriSTORY');

alter table indicateur_resultat_import
    add column source_id text
        references indicateur_source;

update indicateur_resultat_import
set source_id =
        case
            when source ilike '%ORCAE%' then 'orcae'
            when source ilike '%CITEPA%' then 'citepa'
            when source ilike '%Cerema%' then 'cerema'
            else 'terristory' end;

alter table indicateur_resultat_import
    alter column source_id set not null;

create function
    import_sources(indicateur_definitions)
    returns setof indicateur_source
    language sql
    security definer
    stable
begin
    atomic
    select distinct s
    from indicateur_resultat_import iri
             join indicateur_source s on s.id = iri.source_id
    where iri.indicateur_id = $1.indicateur_id
      and iri.collectivite_id = $1.collectivite_id;
end;
comment on function import_sources(indicateur_definitions) is
    'Les sources de données importées associées à un indicateur prédéfini.';

COMMIT;

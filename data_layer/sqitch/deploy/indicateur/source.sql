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

drop view indicateurs;
create view indicateurs
as
select 'resultat'::indicateur_valeur_type as type,
       r.collectivite_id                  as collectivite_id,
       r.indicateur_id                    as indicateur_id,
       null::integer                      as indicateur_perso_id,
       r.annee                            as annee,
       r.valeur                           as valeur,
       c.commentaire                      as commentaire,
       null::text                         as source,
       null::text                         as source_id
from indicateur_resultat r
         join indicateur_definition d on r.indicateur_id = d.id
         left join indicateur_resultat_commentaire c
                   on r.indicateur_id = c.indicateur_id
                       and r.collectivite_id = c.collectivite_id
                       and r.annee = c.annee
where can_read_acces_restreint(r.collectivite_id)
union all

--- indicateurs dont le résultat est en fait celui d'un autre.
select 'resultat'::indicateur_valeur_type as type,
       r.collectivite_id,
       alt.id,
       null::integer,
       r.annee,
       r.valeur,
       c.commentaire,
       null::text,
       null::text
from indicateur_resultat r
         join indicateur_definition alt on r.indicateur_id = alt.valeur_indicateur
         left join indicateur_resultat_commentaire c
                   on r.indicateur_id = c.indicateur_id
                       and r.collectivite_id = c.collectivite_id
                       and r.annee = c.annee
where can_read_acces_restreint(r.collectivite_id)

union all
select 'objectif'::indicateur_valeur_type as type,
       o.collectivite_id,
       d.id,
       null,
       o.annee,
       o.valeur,
       c.commentaire,
       null::text,
       null::text
from indicateur_objectif o
         join indicateur_definition d on o.indicateur_id = d.id
         left join indicateur_objectif_commentaire c
                   on o.indicateur_id = c.indicateur_id
                       and o.collectivite_id = c.collectivite_id
                       and o.annee = c.annee
where can_read_acces_restreint(o.collectivite_id)
union all

--- indicateurs dont l'objectif est en fait celui d'un autre.
select 'objectif'::indicateur_valeur_type as type,
       o.collectivite_id,
       alt.id,
       null,
       o.annee,
       o.valeur,
       c.commentaire,
       null::text,
       null::text
from indicateur_objectif o
         join indicateur_definition alt on o.indicateur_id = alt.valeur_indicateur
         left join indicateur_objectif_commentaire c
                   on o.indicateur_id = c.indicateur_id
                       and o.collectivite_id = c.collectivite_id
                       and o.annee = c.annee
where can_read_acces_restreint(o.collectivite_id)

union all
select 'import'::indicateur_valeur_type as type,
       collectivite_id,
       indicateur_id,
       null,
       annee,
       valeur,
       null,
       source,
       source_id
from indicateur_resultat_import
where can_read_acces_restreint(collectivite_id)

union all
--- indicateurs dont le résultat est en fait celui d'un autre.
select 'import'::indicateur_valeur_type as type,
       i.collectivite_id,
       alt.id,
       null::integer,
       i.annee,
       i.valeur,
       null,
       i.source,
       i.source_id
from indicateur_resultat_import i
         join indicateur_definition alt on i.indicateur_id = alt.valeur_indicateur
where can_read_acces_restreint(i.collectivite_id)

union all
select 'resultat'::indicateur_valeur_type as type,
       collectivite_id,
       null,
       r.indicateur_id,
       r.annee,
       r.valeur,
       c.commentaire,
       null,
       null
from indicateur_personnalise_resultat r
         left join indicateur_perso_resultat_commentaire c using (collectivite_id, indicateur_id, annee)
where can_read_acces_restreint(collectivite_id)

union all
select 'objectif'::indicateur_valeur_type as type,
       r.collectivite_id,
       null,
       r.indicateur_id,
       r.annee,
       r.valeur,
       commentaire,
       null,
       null
from indicateur_personnalise_objectif r
         left join indicateur_perso_objectif_commentaire c using (collectivite_id, indicateur_id, annee)
where can_read_acces_restreint(collectivite_id)
;

COMMIT;

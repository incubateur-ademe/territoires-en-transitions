-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;


alter table indicateur_definition
    drop column parent;

alter table indicateur_definition
    rename column indicateur_group to groupe;

alter table indicateur_definition
    add participation_score bool default false not null;

comment on column indicateur_definition.participation_score is
    'Vrai si il est prévu que l''indicateur participe au score du référentiel.';

alter table indicateur_definition
    add titre_long text default '' not null;

comment on column indicateur_definition.titre_long is
    'Le titre complet.';

alter table indicateur_definition
    add parent indicateur_id;

comment on column indicateur_definition.parent is
    'L''id de l''indicateur parent.';

alter table indicateur_definition
    add source text;

comment on column indicateur_definition.source is
    'La source de la donnée.';


create type indicateur_referentiel_type as enum ('resultat', 'impact');

alter table indicateur_definition
    add type indicateur_referentiel_type;

comment on column indicateur_definition.type is
    'Le type d''indicateur, résultat ou impact.';

create type indicateur_thematique as enum ('eci_dechets', 'energie_et_climat');

alter table indicateur_definition
    add thematiques indicateur_thematique[] default array []::indicateur_thematique[] not null;

create type indicateur_programme as enum ('clef', 'eci', 'cae', 'pcaet', 'crte');

alter table indicateur_definition
    add programmes indicateur_programme[] default array []::indicateur_programme[] not null;

alter table indicateur_definition
    drop obligation_eci;

alter table indicateur_commentaire
    add annee integer; -- todo not null

comment on column indicateur_commentaire.annee is
    'L''année du résultat sur lequel porte le commentaire.';

alter table indicateur_commentaire
    rename to indicateur_resultat_commentaire;

alter table indicateur_resultat_commentaire
    add constraint unique_collectivite_indicateur_annee unique (collectivite_id, indicateur_id, annee);

alter table indicateur_resultat_commentaire
    drop constraint indicateur_commentaire_pkey;

create view indicateur_rempli
as
select indicateur_id,
       null              as perso_id,
       collectivite_id,
       count(valeur) > 0 as rempli
from indicateur_resultat ir
group by indicateur_id, collectivite_id
union all
select null,
       indicateur_id,
       collectivite_id,
       count(valeur) > 0
from indicateur_personnalise_resultat ipr
group by indicateur_id, collectivite_id;
comment on view indicateur_rempli is 'Permet de filtrer les indicateurs par remplissage.';
comment on column indicateur_rempli.rempli is 'Vrai si un résultat a été saisi.';

create table indicateur_thematique_nom
(
    id  indicateur_thematique primary key,
    nom text
);
comment on table indicateur_thematique_nom is 'Les ids thématiques et leurs noms.';
alter table indicateur_thematique_nom
    enable row level security;
create policy allow_read_for_all on indicateur_thematique_nom for select using (true);

create table indicateur_resultat_import
(

    collectivite_id integer          not null references collectivite,
    indicateur_id   indicateur_id    not null references indicateur_definition,
    annee           integer          not null,
    valeur          double precision not null,
    modified_at     timestamptz      not null,
    source          text             not null,
    unique (collectivite_id, indicateur_id, annee)
);
select private.add_modified_at_trigger('public', 'indicateur_resultat_import');
comment on table indicateur_resultat_import is 'Les résultats importés de sources extérieures';
alter table indicateur_resultat_import
    enable row level security;
create policy allow_read on indicateur_resultat_import for select using (have_lecture_acces(collectivite_id));

create table indicateur_objectif_commentaire
(
    collectivite_id integer       not null references collectivite,
    indicateur_id   indicateur_id not null references indicateur_definition,
    annee           integer       not null,
    commentaire     text          not null,
    modified_by     uuid          not null references auth.users,
    modified_at     timestamptz   not null,
    unique (collectivite_id, indicateur_id, annee)
);

select private.add_modified_at_trigger('public', 'indicateur_objectif_commentaire');
select private.add_modified_by_trigger('public', 'indicateur_objectif_commentaire');


create table indicateur_perso_objectif_commentaire
(
    collectivite_id integer     not null references collectivite,
    indicateur_id   integer     not null references indicateur_personnalise_definition,
    annee           integer     not null,
    commentaire     text        not null,
    modified_by     uuid        not null references auth.users,
    modified_at     timestamptz not null,
    unique (collectivite_id, indicateur_id, annee)
);

select private.add_modified_at_trigger('public', 'indicateur_perso_objectif_commentaire');
select private.add_modified_by_trigger('public', 'indicateur_perso_objectif_commentaire');


create table indicateur_perso_resultat_commentaire
(
    collectivite_id integer     not null references collectivite,
    indicateur_id   integer     not null references indicateur_personnalise_definition,
    annee           integer     not null,
    commentaire     text        not null,
    modified_by     uuid        not null references auth.users,
    modified_at     timestamptz not null,
    unique (collectivite_id, indicateur_id, annee)
);

select private.add_modified_at_trigger('public', 'indicateur_perso_resultat_commentaire');
select private.add_modified_by_trigger('public', 'indicateur_perso_resultat_commentaire');


create type indicateur_valeur_type as enum ('resultat', 'objectif', 'import');

create view indicateurs
as
select 'resultat'::indicateur_valeur_type as type,
       r.collectivite_id,
       case
           when d.valeur_indicateur is null
               then r.indicateur_id
           else d.valeur_indicateur
           end                            as indicateur_id,
       null::integer                      as indicateur_perso_id,
       r.annee,
       case
           when d.valeur_indicateur is null
               then r.valeur
           else (select valeur
                 from indicateur_resultat rr
                 where rr.collectivite_id = r.collectivite_id
                   and rr.annee = r.annee
                   and rr.indicateur_id = r.indicateur_id)
           end                            as valeur,
       case
           when d.valeur_indicateur is null
               then c.commentaire
           else (select cc.commentaire
                 from indicateur_resultat_commentaire cc
                 where cc.collectivite_id = r.collectivite_id
                   and cc.annee = r.annee
                   and cc.indicateur_id = r.indicateur_id)
           end                            as commentaire,
       null::text                         as source
from indicateur_resultat r
         join indicateur_definition d on r.indicateur_id = d.id
         left join indicateur_resultat_commentaire c
                   on r.indicateur_id = c.indicateur_id
                       and r.collectivite_id = c.collectivite_id
                       and r.annee = c.annee
where have_lecture_acces(r.collectivite_id)
union all
select 'objectif'::indicateur_valeur_type as type,
       o.collectivite_id,
       case
           when d.valeur_indicateur is null
               then o.indicateur_id
           else d.valeur_indicateur
           end                            as indicateur_id,
       null,
       o.annee,
       case
           when d.valeur_indicateur is null
               then o.valeur
           else (select valeur
                 from indicateur_objectif rr
                 where rr.collectivite_id = o.collectivite_id
                   and rr.annee = o.annee
                   and rr.indicateur_id = o.indicateur_id)
           end                            as valeur,

       case
           when d.valeur_indicateur is null
               then c.commentaire
           else (select cc.commentaire
                 from indicateur_objectif_commentaire cc
                 where cc.collectivite_id = o.collectivite_id
                   and cc.annee = o.annee
                   and cc.indicateur_id = o.indicateur_id)
           end                            as commentaire,
       null::text                         as source
from indicateur_objectif o
         join indicateur_definition d on o.indicateur_id = d.id
         left join indicateur_objectif_commentaire c
                   on o.indicateur_id = c.indicateur_id
                       and o.collectivite_id = c.collectivite_id
                       and o.annee = c.annee
where have_lecture_acces(o.collectivite_id)
union all
select 'import'::indicateur_valeur_type as type,
       collectivite_id,
       indicateur_id,
       null,
       annee,
       valeur,
       null,
       source
from indicateur_resultat_import
where have_lecture_acces(collectivite_id)

union all
select 'resultat'::indicateur_valeur_type as type,
       collectivite_id,
       null,
       r.indicateur_id,
       r.annee,
       r.valeur,
       c.commentaire,
       null
from indicateur_personnalise_resultat r
         left join indicateur_perso_resultat_commentaire c using (collectivite_id, indicateur_id, annee)
where have_lecture_acces(collectivite_id)

union all
select 'objectif'::indicateur_valeur_type as type,
       r.collectivite_id,
       null,
       r.indicateur_id,
       r.annee,
       r.valeur,
       commentaire,
       null
from indicateur_personnalise_resultat r
         left join indicateur_perso_objectif_commentaire c using (collectivite_id, indicateur_id, annee)
where have_lecture_acces(collectivite_id)
;

comment on view indicateurs is 'Les valeurs des indicateurs consolidées.';

create function
    rewrite_indicateur_id()
    returns trigger
as
$$
declare
    valeur_id indicateur_id;
begin
    select valeur_indicateur
    into valeur_id
    from indicateur_definition
    where id = new.indicateur_id;

    if valeur_id is not null
    then
        new.indicateur_id = valeur_id;
    end if;

    return new;
end;
$$ language plpgsql;
comment on function
    rewrite_indicateur_id is 'Réécrit les ids des indicateurs pour les résultats et les objectifs.';

create trigger rewrite_indicateur_id
    before insert or update
    on indicateur_resultat
    for each row
execute procedure rewrite_indicateur_id();

create trigger rewrite_indicateur_id
    before insert or update
    on indicateur_objectif
    for each row
execute procedure rewrite_indicateur_id();

COMMIT;

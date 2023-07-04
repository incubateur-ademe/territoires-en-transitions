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
       null         as perso_id,
       collectivite_id,
       count(*) > 0 as rempli
from indicateur_resultat ir
group by indicateur_id, collectivite_id
union all
select null,
       indicateur_id,
       collectivite_id,
       count(*) > 0
from indicateur_personnalise_resultat ipr
group by indicateur_id, collectivite_id;
comment on view indicateur_rempli is 'Permet de filtrer les indicateurs par remplissage.';
comment on column indicateur_rempli.rempli is 'Vrai si un résultat a été saisi.';

create table indicateur_thematique
(
    id  text primary key,
    nom text
);
comment on table indicateur_thematique is 'Les ids thématiques et leurs noms.';
alter table indicateur_thematique
    enable row level security;
create policy allow_read_for_all on indicateur_thematique for select using (true);

COMMIT;

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

create type indicateur_thematique as enum ('eci_dechets');

alter table indicateur_definition
    add thematiques indicateur_thematique[] default array[]::indicateur_thematique[] not null;


COMMIT;

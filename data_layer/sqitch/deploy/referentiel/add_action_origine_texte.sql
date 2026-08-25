-- Deploy tet:referentiel/add_action_origine_texte to pg

BEGIN;

create table if not exists action_origine_texte
(
    referentiel_id          varchar(30) references referentiel_definition not null,
    action_id               varchar(30) references action_relation not null,
    origine_referentiel_id  varchar(30) references referentiel_definition not null,
    origine_action_id       varchar(30) references action_relation not null,
    CONSTRAINT "action_origine_texte_unique" UNIQUE("referentiel_id", "action_id", "origine_referentiel_id", "origine_action_id")
);
comment on table action_origine_texte is
    'Lien complémentaire (issu de la colonne origineTexte) entre une action du nouveau référentiel et une action d''un ancien référentiel';

alter table action_origine_texte enable row level security;
create policy allow_read on action_origine_texte for select using(is_authenticated());

COMMIT;

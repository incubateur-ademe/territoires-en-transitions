-- Deploy tet:evaluation/consequence to pg
-- requires: collectivite/collectivite

BEGIN;

create table personnalisation_consequence
(
    collectivite_id integer references collectivite not null,
    consequences    jsonb                           not null,
    primary key (collectivite_id)
) inherits (abstract_modified_at);
comment on table personnalisation_consequence is
    'Conséquences des règles de personnalisation par collectivité, calculées par le business à chaque mise à jour d''une réponse aux questions. ';
comment on column personnalisation_consequence.consequences is
    'JSON  dont les clés sont des id d''actions et les valeurs sont des objets {desactive: bool, potentiel_personnalise: number} .';

create trigger set_modified_at_before_personnalisation_consequence_update
    before update
    on
        personnalisation_consequence
    for each row
execute procedure update_modified_at();

COMMIT;

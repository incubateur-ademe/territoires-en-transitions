-------------------------------------------------------
----------- CONSEQUENCE PERSONNALISATION --------------
-------------------------------------------------------
create table personnalisation_consequence
(
    collectivite_id         integer references collectivite not null,
    consequences            jsonb                           not null,
    consequences_created_at timestamp with time zone        not null,
    primary key (collectivite_id)
);
comment on table personnalisation_consequence is
    'Conséquences des règles de personnalisation par collectivité, calculées par le business à chaque mise à jour d''une réponse aux questions. ';
comment on column personnalisation_consequence.consequences is
    'JSON  dont les clés sont des id d''actions et les valeurs sont des objets {desactive: bool, potentiel_personnalise: number} .';

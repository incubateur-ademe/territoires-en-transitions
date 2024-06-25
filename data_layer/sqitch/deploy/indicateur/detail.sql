-- Deploy tet:indicateur/detail to pg

BEGIN;

create or replace view indicateur_definitions
as
SELECT * FROM (
    select c.id           as collectivite_id,
        definition.id  as indicateur_id,
        null::integer  as indicateur_perso_id,
        definition.nom as nom,
        definition.description,
        definition.unite
    from collectivite c
            cross join indicateur_definition definition
    where is_authenticated()
    union all
    select definition.collectivite_id as collectivite_id,
        null::indicateur_id        as indicateur_id,
        definition.id              as indicateur_perso_id,
        definition.titre,
        definition.description,
        definition.unite
    from indicateur_personnalise_definition definition
) AS f
WHERE can_read_acces_restreint(f.collectivite_id);

comment on view indicateur_definitions
    is 'Les définitions des indicateurs prédéfinis et personnalisés';

COMMIT;

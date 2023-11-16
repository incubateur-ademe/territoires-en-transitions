-- Deploy tet:taxonomie/thematique to pg

BEGIN;

-- Remplace la colonne thematique par thematique_id
-- pour récupérer le lien entre thematique et sous_thematique
alter table sous_thematique
    add column thematique_id integer references thematique;

update sous_thematique
set thematique_id = (select id from thematique where nom = sous_thematique.thematique)
where thematique_id is null;

alter table sous_thematique
    alter column thematique_id set not null,
    drop constraint sous_thematique_thematique_sous_thematique_key,
    drop column thematique,
    add unique(sous_thematique, thematique_id);

update thematique
set nom = 'Stratégie, organisation, coopération et valorisation'
where nom = 'Stratégie, organisation interne, coopération et valorisation';

update sous_thematique
set sous_thematique = 'Organisation et transversalité interne'
where sous_thematique = 'Organisation interne'
  and thematique_id = (
    select id
    from thematique
    where nom = 'Stratégie, organisation, coopération et valorisation'
);

update sous_thematique
set sous_thematique = 'Qualité des sols'
where sous_thematique = 'Sols'
  and thematique_id = (
    select id
    from thematique
    where nom = 'Nature, environnement, air'
);

insert into sous_thematique (sous_thematique, thematique_id)
values (
           'Réduction des prélèvements en ressources naturelles',
           (select id
            from thematique
            where nom = 'Nature, environnement, air'
            limit 1)
       ),
       (
           'Prévention des déchets',
           (select id
            from thematique
            where nom = 'Économie circulaire et déchets'
            limit 1)
       ),
       (
           'Artificialisation des sols',
           (select id
            from thematique
            where nom = 'Urbanisme, logement, aménagement, bâtiments'
            limit 1)
       ),
       (
           'Accompagnement au changement de comportements',
           (select id
            from thematique
            where nom = 'Stratégie, organisation, coopération et valorisation'
            limit 1)
       );

COMMIT;

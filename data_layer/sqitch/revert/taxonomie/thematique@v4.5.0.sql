-- Deploy tet:taxonomie/thematique to pg

BEGIN;

update thematique
set nom = 'Stratégie, organisation interne, coopération et valorisation'
where nom = 'Stratégie, organisation, coopération et valorisation';

alter table sous_thematique
    add column thematique text;

update sous_thematique
set thematique = (select nom::text from thematique where id = sous_thematique.thematique_id)
where sous_thematique.thematique is null;

alter table sous_thematique
    alter column thematique set not null,
    drop constraint sous_thematique_sous_thematique_thematique_id_key,
    drop column thematique_id,
    add unique(thematique, sous_thematique);

update sous_thematique
set sous_thematique = 'Organisation interne'
where sous_thematique = 'Organisation et transversalité interne'
  and thematique = 'Stratégie, organisation interne, coopération et valorisation';

update sous_thematique
set sous_thematique = 'Sols'
where sous_thematique = 'Qualité des sols'
  and thematique = 'Nature, environnement, air';

delete from sous_thematique
where (
            sous_thematique = 'Réduction des prélèvements en ressources naturelles'
        and thematique = 'Nature, environnement, air'
    ) or (
            sous_thematique = 'Prévention des déchets'
        and thematique = 'Économie circulaire et déchets'
    ) or (
            sous_thematique = 'Artificialisation des sols'
        and thematique = 'Urbanisme, logement, aménagement, bâtiments'
    ) or (
            sous_thematique = 'Accompagnement au changement de comportements'
        and thematique = 'Stratégie, organisation interne, coopération et valorisation'
    );

COMMIT;

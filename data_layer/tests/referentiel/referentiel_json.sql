begin;
select plan(4);

truncate referentiel_json;
truncate action_relation cascade;

select is_empty(
               'select * from action_definition',
               'Il devrait ne plus y avoir de définition du référentiel'
           );

insert into referentiel_json (definitions, children)
values ('
        [
          {
            "action_id": "eci",
            "referentiel": "eci",
            "identifiant": "",
            "nom": "Économie Circulaire",
            "description": "",
            "contexte": "",
            "exemples": "",
            "ressources": "",
            "perimetre_evaluation": "",
            "reduction_potentiel": "",
            "md_points": 500.0,
            "md_pourcentage": null,
            "computed_points": 500.0,
            "categorie": null
          },
          {
            "action_id": "eci_2",
            "referentiel": "eci",
            "identifiant": "2",
            "nom": "Développement des services de réduction, collecte et valorisation des déchets",
            "description": "",
            "contexte": "",
            "exemples": "",
            "ressources": "",
            "perimetre_evaluation": "",
            "reduction_potentiel": "",
            "md_points": 80.0,
            "md_pourcentage": null,
            "computed_points": 80.0,
            "categorie": null
          }
        ]
        '::jsonb, '
        [
          {
            "referentiel": "eci",
            "action_id": "eci",
            "children": [
              "eci_2"
            ]
          },
          {
            "referentiel": "eci",
            "action_id": "eci_2",
            "children": []
          }
        ]
        '::jsonb);

select isnt_empty(
               'select * from referentiel_json',
               'Le référentiel au format json devrait être présent'
           );

select bag_eq(
               'select (jsonb_array_elements( children )) ->> ''action_id'' from referentiel_json',
               'select id from action_relation;',
               'Toutes les `action_id` du referentiel devraient être dans la table `action_relation`'
           );

select bag_eq(
               'select (jsonb_array_elements( definitions )) ->> ''nom'' from referentiel_json',
               'select nom from action_definition',
               'Tous les noms des actions du referentiel devraient être dans la table `action_definition`'
           );

rollback;
